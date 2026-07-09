// eslint-disable-next-line object-curly-newline
import React, {
  useState, useEffect, Suspense, lazy, useCallback, useRef,
} from 'react';
import { Router, Route } from 'react-router-dom';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import { createBrowserHistory } from 'history';
import PropTypes from 'prop-types';
import { ErrorBoundary } from 'react-error-boundary';

import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core/styles';

import Navbar from './Navbar';
import Alerts from './Alerts';
import UnauthenticatedApp from './UnauthenticatedApp';
// import loadScript from './utils/load-script';
// import removeScript from './utils/remove-script';
import { loginDSGUser } from './actions/user';
import config from './config';
import { expandDatasets } from './utils/config';
import { authBaseFromProjectUrl } from './utils/auth';
import {
  checkDatasetAccess,
  canonicalDatasetName,
  clearTosLoopGuard,
  datasetAccessFingerprint,
  datasetAccessGate,
  isCurrentDatasetAccessRequest,
  readTosLoopGuard,
  selectedDatasetReturnUrl,
  setTosLoopGuard,
} from './utils/datasetAccess';
import TosRequiredView from './TosRequiredView';
import { addAlert } from './actions/alerts';

import './App.css';

const history = createBrowserHistory();

const Home = lazy(() => import('./Home'));
const Settings = lazy(() => import('./Settings'));
const UserAdmin = lazy(() => import('./UserAdmin'));
const WorkSpaces = lazy(() => import('./WorkSpaces'));
const AuthTest = lazy(() => import('./AuthTest'));
const Help = lazy(() => import('./Help'));
const Docs = lazy(() => import('./Docs'));

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#739574',
    },
  },
  typography: {
    fontSize: 11,
  },
  props: {
    MuiButton: {
      size: 'small',
    },
    MuiFilledInput: {
      margin: 'dense',
    },
    MuiFormControl: {
      margin: 'none',
    },
    MuiFormHelperText: {
      margin: 'dense',
    },
    MuiIconButton: {
      size: 'small',
    },
    MuiInputBase: {
      margin: 'dense',
    },
    MuiInputLabel: {
      margin: 'dense',
    },
    MuiListItem: {
      dense: true,
    },
    MuiOutlinedInput: {
      margin: 'dense',
    },
    MuiFab: {
      size: 'small',
    },
    MuiTable: {
      size: 'small',
    },
    MuiTextField: {
      margin: 'dense',
    },
    MuiToolbar: {
      variant: 'dense',
    },
  },
  overrides: {
    MuiIconButton: {
      sizeSmall: {
        // Adjust spacing to reach minimal touch target hitbox
        marginLeft: 4,
        marginRight: 4,
        padding: 6,
      },
    },
    MuiTooltip: {
      tooltip: {
        fontSize: 12,
      },
    },
    MuiPagination: {
      root: {
        display: 'inline-block',
      },
    },
  },
});

function ErrorFallback(props) {
  const { error } = props;
  return (
    <div role="alert">
      <p>
        Clio has produced an internal error. Please send the following error information to the
        FlyEM software team.
      </p>
      <pre>{error.stack}</pre>
    </div>
  );
}

ErrorFallback.propTypes = {
  error: PropTypes.object.isRequired,
};

function App() {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);
  const projectUrl = useSelector((state) => state.clio.get('projectUrl'), shallowEqual);
  const [datasets, setDatasets] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Initialize dataset from URL params. Shared localStorage causes cross-tab
  // confusion during DSG service-specific TOS flows.
  const getInitialDataset = useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlDataset = searchParams.get('dataset');
    return urlDataset || null;
  }, []);

  const [selectedDatasetName, setSelectedDatasetNameState] = useState(getInitialDataset);
  const [datasetAccessCheck, setDatasetAccessCheck] = useState({
    fingerprint: null,
    result: undefined,
  });
  const [tosFallback, setTosFallback] = useState(null);
  const selectedDatasetNameRef = useRef(selectedDatasetName);
  const selectedDatasetKeyRef = useRef(null);
  const previousDatasetKeyRef = useRef(null);

  // Update URL when dataset changes
  const setSelectedDataset = useCallback((datasetName) => {
    setSelectedDatasetNameState(datasetName);
    setTosFallback(null);

    // Update URL
    const searchParams = new URLSearchParams(window.location.search);
    if (datasetName) {
      searchParams.set('dataset', datasetName);
    } else {
      searchParams.delete('dataset');
    }
    const newUrl = searchParams.toString()
      ? `${window.location.pathname}?${searchParams.toString()}`
      : window.location.pathname;
    history.replace(newUrl);
  }, []);

  // Sync dataset from URL on history change
  useEffect(() => {
    const unlisten = history.listen(() => {
      const searchParams = new URLSearchParams(window.location.search);
      const urlDataset = searchParams.get('dataset');
      if (urlDataset !== selectedDatasetName) {
        setSelectedDatasetNameState(urlDataset);
        setTosFallback(null);
      }
    });
    return unlisten;
  }, [selectedDatasetName]);

  // This effect will fire off a request to the production clio store to let us know when
  // a client is using a non standard production or test url. This should be a very rare
  // case, but we want to know when it happens to check and see what the url was.
  useEffect(() => {
    if (process.env.REACT_APP_REPORTS) {
      const defaultProd = `${config.projectBaseUrlDefault}/${config.top_level_function}`;
      const defaultTest = `${config.projectBaseUrlTest}/${config.top_level_function}`;
      if (!(defaultProd === projectUrl || defaultTest === projectUrl)) {
        if (user) {
          const data = {
            projectUrl,
            defaultProd,
            defaultTest,
            user: user.info.email,
          };
          const options = {
            method: 'POST',
            keepalive: 'true',
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          };

          fetch(`${defaultProd}/site-reports`, options)
            .then((res) => res.json())
            .then((res) => console.log(res));
        }
      }
    }
  }, [projectUrl, user]);

  useEffect(() => {
    if (!user) {
      setDatasets(null);
      return undefined;
    }

    setDatasets(null);
    const options = {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    };

    const datasetUrl = `${projectUrl}/datasets`;
    fetch(datasetUrl, options)
      .then((result) => {
        if (!result.ok) {
          // Create a custom error with response info
          return result.text().then((text) => {
            const error = new Error(`Request failed with status ${result.status}`);
            error.status = result.status;
            error.statusText = result.statusText;
            error.body = text;
            throw error;
          });
        }
        return result.json();
      })
      .then((res) => {
        const datasetsArray = expandDatasets(res);
        setDatasets(datasetsArray);
      })
      .catch((err) => {
        console.error('Error fetching datasets:', err);
        dispatch(addAlert({
          severity: 'error',
          message: 'Failed to load datasets from the server. Please logout and log back in. If the error persists, please contact support.',
        }));
      });
    return undefined;
  }, [user, dispatch, projectUrl]);

  // Rehydrate the user session from the backend. In DSG mode the dsg_token
  // HttpOnly cookie survives page reloads, so we just ask the backend who we
  // are via /profile. The loginDSGUser thunk installs the Neuroglancer bridge
  // (window.neurohub.clio.auth) with the fresh Bearer token so our neuroglancer
  // fork can authenticate against clio-store.
  useEffect(() => {
    if (!projectUrl) return undefined;
    let cancelled = false;
    setAuthChecked(false);

    dispatch(loginDSGUser()).then(() => {
      if (!cancelled) setAuthChecked(true);
    });

    return () => {
      cancelled = true;
    };
  }, [dispatch, projectUrl]);

  useEffect(() => {
    if (!projectUrl) return undefined;

    const refreshVisibleSession = () => {
      if (document.visibilityState && document.visibilityState !== 'visible') return;
      dispatch(loginDSGUser());
    };

    window.addEventListener('focus', refreshVisibleSession);
    window.addEventListener('pageshow', refreshVisibleSession);
    document.addEventListener('visibilitychange', refreshVisibleSession);

    return () => {
      window.removeEventListener('focus', refreshVisibleSession);
      window.removeEventListener('pageshow', refreshVisibleSession);
      document.removeEventListener('visibilitychange', refreshVisibleSession);
    };
  }, [dispatch, projectUrl]);

  useEffect(() => {
    selectedDatasetNameRef.current = selectedDatasetName;
    selectedDatasetKeyRef.current = canonicalDatasetName(datasets, selectedDatasetName);
  }, [datasets, selectedDatasetName]);

  useEffect(() => {
    const datasetKey = canonicalDatasetName(datasets, selectedDatasetName);
    const previousDatasetKey = previousDatasetKeyRef.current;
    if (previousDatasetKey && previousDatasetKey !== datasetKey) {
      clearTosLoopGuard(previousDatasetKey);
    }
    previousDatasetKeyRef.current = datasetKey;
  }, [datasets, selectedDatasetName]);

  useEffect(() => {
    const gate = datasetAccessGate({
      user,
      datasets,
      selectedDatasetName,
      checkResult: undefined,
    });
    if (!projectUrl || gate.action !== 'query') {
      setDatasetAccessCheck({ fingerprint: null, result: null });
      return undefined;
    }

    const requestFingerprint = datasetAccessFingerprint(selectedDatasetName, gate.datasetKey);
    const redirectUrl = selectedDatasetReturnUrl(window.location.href, selectedDatasetName);
    let cancelled = false;
    setDatasetAccessCheck({ fingerprint: requestFingerprint, result: undefined });

    checkDatasetAccess({
      authBase: authBaseFromProjectUrl(projectUrl),
      datasetKey: gate.datasetKey,
      redirectUrl,
    }).then((result) => {
      if (
        cancelled
        || !isCurrentDatasetAccessRequest(
          requestFingerprint,
          selectedDatasetNameRef.current,
          selectedDatasetKeyRef.current,
        )
      ) return;
      setDatasetAccessCheck({ fingerprint: requestFingerprint, result });
    });

    return () => {
      cancelled = true;
    };
  }, [datasets, projectUrl, selectedDatasetName, user]);

  useEffect(() => {
    const datasetKey = canonicalDatasetName(datasets, selectedDatasetName);
    const fingerprint = datasetAccessFingerprint(selectedDatasetName, datasetKey);
    const checkResult = datasetAccessCheck.fingerprint === fingerprint
      ? datasetAccessCheck.result
      : undefined;
    const gate = datasetAccessGate({
      user,
      datasets,
      selectedDatasetName,
      checkResult,
      loopGuardState: readTosLoopGuard(datasetKey),
    });

    if (gate.loopGuard === 'clear') clearTosLoopGuard(gate.datasetKey);
    if (gate.action === 'show-card') {
      setTosFallback({ datasetName: selectedDatasetName, tosUrl: gate.tosUrl });
      return;
    }

    setTosFallback(null);
    if (gate.action === 'redirect') {
      setTosLoopGuard(gate.datasetKey);
      window.location.href = gate.tosUrl;
    }
  }, [datasetAccessCheck, datasets, selectedDatasetName, user]);

  const retryTosAcceptance = useCallback(() => {
    const datasetKey = canonicalDatasetName(datasets, selectedDatasetName);
    if (!datasetKey || !projectUrl) return;

    const requestFingerprint = datasetAccessFingerprint(selectedDatasetName, datasetKey);
    const redirectUrl = selectedDatasetReturnUrl(window.location.href, selectedDatasetName);
    setDatasetAccessCheck({ fingerprint: requestFingerprint, result: undefined });
    checkDatasetAccess({
      authBase: authBaseFromProjectUrl(projectUrl),
      datasetKey,
      redirectUrl,
    }).then((result) => {
      if (!isCurrentDatasetAccessRequest(
        requestFingerprint,
        selectedDatasetNameRef.current,
        selectedDatasetKeyRef.current,
      )) return;
      if (result && result.tos_required && result.tos_url) {
        setTosLoopGuard(datasetKey);
        window.location.href = result.tos_url;
        return;
      }
      setDatasetAccessCheck({ fingerprint: requestFingerprint, result });
    });
  }, [datasets, projectUrl, selectedDatasetName]);

  // if not logged in then show the login page for all routes.
  if (!user && !authChecked) {
    return (
      <ThemeProvider theme={theme}>
        <div className="App">Loading...</div>
      </ThemeProvider>
    );
  }

  if (!user) {
    return <UnauthenticatedApp history={history} theme={theme} />;
  }

  const tosPending = !!(
    tosFallback && tosFallback.datasetName === selectedDatasetName
  );
  // The inner ErrorBoundary should catch most errors, and will keep the Navbar with the
  // Neurohub branding.  The outer ErrorBoundary is a last resort, in case there is an
  // error in the Navbar itself.
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Router history={history}>
        <ThemeProvider theme={theme}>
          <Navbar
            history={history}
            datasets={datasets || []}
            selectedDatasetName={selectedDatasetName}
            setSelectedDataset={setSelectedDataset}
          />
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <div className="App">
              <Suspense fallback={<div>Loading Homepage...</div>}>
                <Route path="/" exact component={Home} />
              </Suspense>
              <Suspense fallback={<div>Loading...</div>}>
                <Route path="/ws/:ws">
                  {tosPending ? (
                    <TosRequiredView
                      datasetName={selectedDatasetName}
                      onAccept={retryTosAcceptance}
                    />
                  ) : (
                    <WorkSpaces
                      datasets={datasets || []}
                      selectedDatasetName={selectedDatasetName}
                    />
                  )}
                </Route>
                <Route path="/settings" component={Settings} />
                <Route path="/help" component={Help} />
                <Route path="/api/docs" component={Docs} />
                <Route path="/users" component={UserAdmin} />
                <Route path="/auth_test" component={AuthTest} />
              </Suspense>
            </div>
            <Alerts />
          </ErrorBoundary>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
