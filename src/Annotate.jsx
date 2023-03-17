import React, { useEffect, useState, useCallback } from 'react';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import Drawer from '@material-ui/core/Drawer';
import Fab from '@material-ui/core/Fab';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { useSelector, shallowEqual } from 'react-redux';
import { getNeuroglancerColor } from '@janelia-flyem/react-neuroglancer';
import activeElementNeedsKeypress from './utils/events';
import debounce from './utils/debounce';
import {
  makeLayersFromDataset,
  hasMergeableLayer,
  makeViewOptionsFromDataset,
  retrieveViewerState,
  saveViewerState,
} from './utils/neuroglancer';
import AnnotationPanel from './Annotation/AnnotationPanel';
import {
  ATLAS_COLUMNS,
  ANNOTATION_SHADER,
  ATLAS_SHADER,
  getAnnotationColumnSetting,
  getBodyAnnotationColumnSetting,
} from './Annotation/AnnotationUtils';
import NeuPrintManager from './Connections/NeuPrintManager';
import ConnectionsPanel from './Connections/ConnectionsPanel';
import MergeBackendCloud from './Annotation/MergeBackendCloud';
import MergeManager from './Annotation/MergeManager';
import { MergePanel, onKeyPressMerge, onVisibleChangedMerge } from './Annotation/MergePanel';
import BodyAnnotation from './Annotation/BodyAnnotation';

import './Neuroglancer.css';

const SIDEBAR_WIDTH_PX = 550;
const SIDEBAR_EXPANDED_WIDTH_PX = 800;
const SIDEBAR_SPACING_PX = 10;

const useStyles = makeStyles((theme) => {
  const fabSidebar = {
    position: 'absolute',
    bottom: theme.spacing(2),
    // Necessary for events to go to a button on top of Neuroglancer.
    zIndex: 3,
  };
  const ngSidebar = {
    display: 'flex',
    flexFlow: 'column',
    height: '100%',
    flexGrow: 1,
  };
  return ({
    fabSidebarOpen: (props) => ({
      ...fabSidebar,
      transition: theme.transitions.create(['right'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      right: `${props.sidebarWidth + SIDEBAR_SPACING_PX}px`,
    }),
    fabSidebarClosed: {
      ...fabSidebar,
      transition: theme.transitions.create(['right'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      right: `${SIDEBAR_SPACING_PX}px`,
    },
    ngSidebarOpen: (props) => ({
      ...ngSidebar,
      transition: theme.transitions.create(['margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      marginRight: props.sidebarWidth,
    }),
    ngSidebarClosed: {
      ...ngSidebar,
      transition: theme.transitions.create(['margin'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginRight: 0,
    },
    drawerPaper: {
      top: 'inherit',
    },
  });
});

// eslint-disable-next-line object-curly-newline
export default function Annotate({ children, actions, datasets, selectedDatasetName }) {
  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);
  // const dataset = datasets.filter((ds) => ds.name === selectedDatasetName)[0];
  const dataset = datasets.find((ds) => ds.name === selectedDatasetName);
  const projectUrl = useSelector((state) => state.clio.get('projectUrl'), shallowEqual);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_WIDTH_PX);
  const classes = useStyles({ sidebarWidth });
  const [bodyAnnotatinQuery, setBodyAnnotationQuery] = useState({});
  // const [neuPrintManager, setNeuPrintManager] = React.useState(null);
  // const [mergeManager, setMergeManager] = React.useState(null);


  const roles = useSelector((state) => state.user.get('roles'), shallowEqual);
  let { groups } = roles;
  if (groups && groups.length > 0) {
    if (!roles.global_roles || roles.global_roles.indexOf('admin') === -1) {
      groups = groups.filter((group) => !group.startsWith('.'));
    }
  }

  const getAnnotationUrl = React.useCallback(
    (isAtlas) => `clio://${projectUrl}/${dataset.key}?auth=neurohub${isAtlas ? '&kind=atlas' : ''}`,
    [projectUrl, dataset],
  );

  useEffect(() => {
    if (dataset) {
      let viewerOptions = retrieveViewerState(`annotation_${projectUrl}${dataset.name}`);
      if (viewerOptions === null) {
        const layers = [
          ...makeLayersFromDataset(dataset, false),
          {
            name: 'annotations',
            type: 'annotation',
            source: {
              url: getAnnotationUrl(false),
            },
            shader: ANNOTATION_SHADER,
            tool: 'annotatePoint',
          },
          {
            name: 'atlas',
            type: 'annotation',
            source: {
              url: getAnnotationUrl(true),
            },
            shader: ATLAS_SHADER,
            tool: 'annotatePoint',
          },
        ];

        viewerOptions = makeViewOptionsFromDataset(
          dataset,
          {
            layers,
            selectedLayer: {
              layer: 'annotations',
            },
          },
        );
      }

      actions.initViewer(viewerOptions);
    }
  }, [actions, dataset, getAnnotationUrl, projectUrl]);

  const getToken = React.useCallback(() => user.getAuthResponse().id_token, [user]);
  /*
  const neuPrintManager = React.useRef(
    new NeuPrintManager(dataset, projectUrl, getToken),
    [dataset, projectUrl, getToken],
  );
  */

  /*
  useEffect(() => {
    setNeuPrintManager(new NeuPrintManager(dataset, projectUrl, getToken));
    // neuPrintManager.current.init(dataset, projectUrl, getToken);
  }, [dataset, projectUrl, getToken]);
  */

  const neuPrintManager = React.useMemo(
    () => (dataset ? new NeuPrintManager(dataset, projectUrl, getToken) : null),
    [dataset, projectUrl, getToken],
  );

  const mergeManager = React.useMemo(() => {
    if (dataset && neuPrintManager) {
      const backend = new MergeBackendCloud(dataset, projectUrl, getToken, actions.addAlert);
      return new MergeManager(actions, getNeuroglancerColor, backend, neuPrintManager);
    }
    return null;
  }, [dataset, projectUrl, getToken, actions, neuPrintManager]);


  // const mergeManager = React.useRef(new MergeManager());
  /*
  useEffect(() => {
    if (dataset && user && neuPrintManager) {
      const backend = new MergeBackendCloud(dataset, projectUrl, user, actions.addAlert);
      setMergeManager(new MergeManager(actions, getNeuroglancerColor, backend, neuPrintManager));
    }
  }, [actions, dataset, projectUrl, user, neuPrintManager]);
  */

  useEffect(() => {
    if (mergeManager) {
      // FIXME: needs a better solution of avoiding race conditions while updating body states.
      // The delayed update is a temporary workaround.
      const timeout = setTimeout(() => {
        mergeManager.restore();
      }, 3000);
      return () => clearTimeout(timeout);
    }
    return () => {};
  }, [mergeManager]);

  const onKeyPress = useCallback((event) => {
    // Ignore keyboard shortcuts when a Neuroglancer text input has focus.
    if (activeElementNeedsKeypress()) {
      return;
    }
    if (hasMergeableLayer(dataset)) {
      onKeyPressMerge(event, mergeManager);
    }
  }, [dataset, mergeManager]);

  // Neuroglancer's notion of "visible" corresponds to other applications' notion of "selected".
  const onVisibleChanged = useCallback((segments, layer) => {
    onVisibleChangedMerge(segments, layer, mergeManager);
  }, [mergeManager]);

  const selectionDetailsStateChangedHandlers = [];
  const onSelectionDetailsStateChanged = () => {
    selectionDetailsStateChangedHandlers.forEach((handler) => {
      handler();
    });
  };
  const onViewerStateChanged = React.useCallback(debounce((state) => {
    if (state.title) {
      saveViewerState(`annotation_${projectUrl}${state.title}`, state);
    }
  }, 250, false), []);

  // Add `onVisibleChanged` to the props of the child, which is a react-neuroglancer viewer.
  const childrenWithMoreProps = React.Children.map(children, (child) => (
    React.cloneElement(child, {
      onVisibleChanged,
      onSelectionDetailsStateChanged,
      onViewerStateChanged,
    }, null)
  ));

  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleQueryChange = useCallback((query) => {
    if (typeof query === 'string') {
      actions.addAlert({ severity: 'warning', message: `Invalid query: ${query}` });
      return;
    }

    if (dataset && dataset.name) {
      actions.syncViewer();
      setBodyAnnotationQuery((prevState) => ({
        ...prevState,
        [dataset.name]: query,
      }));
    }
  }, [actions, dataset, setBodyAnnotationQuery]);

  const bodyAnnotationConfig = React.useMemo(() => ({
    width: `${sidebarWidth}px`,
    // datasetName: dataset.name,
    user: roles.email,
    dataConfig: {
      columns: getBodyAnnotationColumnSetting(dataset),
    },
  }), [dataset, roles.email, sidebarWidth]);

  if (dataset) {
    const pointTool = {
      name: 'annotatePoint',
      label: 'Point',
      tooltip: 'Ctrl+Click in the data viewer to add a point.',
    };
    const lineTool = {
      name: 'annotateLine',
      label: 'Line',
      tooltip: 'Ctrl+Click in the data viewer to start adding a line. Ctrl+Click again to finish the line.',
    };
    const sphereTool = {
      name: 'annotateSphere',
      label: 'Sphere',
      tooltip: 'Ctrl+Click in the data viewer to start adding a sphere. Ctrl+Click again to finish the sphere.',
    };

    const setSelectionChangedCallback = (callback) => {
      selectionDetailsStateChangedHandlers.splice(
        0, selectionDetailsStateChangedHandlers.length,
      );
      selectionDetailsStateChangedHandlers.push(callback);

      return () => {
        const index = selectionDetailsStateChangedHandlers.indexOf(callback);
        if (index !== -1) {
          selectionDetailsStateChangedHandlers.splice(index, 1);
        }
      };
    };

    const annotationConfig = {
      width: `${sidebarWidth}px`,
      dataset,
      projectUrl,
      datasetName: dataset.name,
      user: roles.email,
      layers: [
        {
          name: 'annotations',
          tools: [pointTool, lineTool, sphereTool],
          dataConfig: {
            columns: getAnnotationColumnSetting(dataset),
            kind: 'Normal',
            allowingImport: true,
            allowingExport: true,
            getToken,
          },
          setSelectionChangedCallback,
          dataSource: {
            name: dataset.name,
            url: getAnnotationUrl(false),
            groups,
          },
        },
        {
          name: 'atlas',
          tools: [pointTool],
          dataConfig: {
            columns: ATLAS_COLUMNS,
            kind: 'Atlas',
            allowingImport: false,
            allowingExport: true,
            getToken,
          },
          setSelectionChangedCallback,
          dataSource: {
            name: dataset.name,
            url: getAnnotationUrl(true),
            groups,
          },
        },
      ],
    };

    const onClickFab = () => {
      // Prevents Neuroglancer `position` from being reset.
      actions.syncViewer();
      setSidebarOpen(!sidebarOpen);
    };

    return (
      <div
        style={{ display: 'flex', height: '100%' }}
      >
        <div
          className={sidebarOpen ? classes.ngSidebarOpen : classes.ngSidebarClosed}
          tabIndex={0}
          onKeyPress={onKeyPress}
          onContextMenu={(event) => {
            event.preventDefault();
          }}
        >
          {childrenWithMoreProps}
        </div>

        <Fab
          className={sidebarOpen ? classes.fabSidebarOpen : classes.fabSidebarClosed}
          color="primary"
          onClick={onClickFab}
        >
          {sidebarOpen ? <ChevronRight /> : <ChevronLeft />}
        </Fab>

        <Drawer
          variant="persistent"
          anchor="right"
          open={sidebarOpen}
          classes={{
            paper: classes.drawerPaper,
          }}
        >
          <AnnotationPanel
            config={annotationConfig}
            actions={actions}
          >
            {
              bodyAnnotationConfig.dataConfig.columns && mergeManager ? (
                <BodyAnnotation
                  tabName="bodies"
                  config={bodyAnnotationConfig}
                  dataset={dataset}
                  projectUrl={projectUrl}
                  getToken={getToken}
                  query={bodyAnnotatinQuery[dataset.name]}
                  onQueryChanged={handleQueryChange}
                  actions={actions}
                  mergeManager={mergeManager}
                />
              ) : null
            }
            {
              hasMergeableLayer(dataset) && mergeManager ? (
                <MergePanel
                  tabName="merges"
                  mergeManager={mergeManager}
                  addAlert={actions.addAlert}
                />
              ) : null
            }
            {
              neuPrintManager && mergeManager ? (
                <ConnectionsPanel
                  tabName="connections"
                  neuPrintManager={neuPrintManager}
                  mergeManager={mergeManager}
                  addAlert={actions.addAlert}
                />
              ) : null
            }
          </AnnotationPanel>
          <Button
            color="primary"
            onClick={
              () => {
                actions.syncViewer();
                setSidebarWidth(
                  (sidebarWidth === SIDEBAR_WIDTH_PX)
                    ? SIDEBAR_EXPANDED_WIDTH_PX
                    : SIDEBAR_WIDTH_PX,
                );
              }
            }
          >
            { (sidebarWidth === SIDEBAR_WIDTH_PX) ? '<-- Wider -->' : '--> Narrower <--' }
          </Button>
        </Drawer>
      </div>
    );
  }
  return <div />;
}

Annotate.propTypes = {
  children: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  datasets: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedDatasetName: PropTypes.string,
};

Annotate.defaultProps = {
  selectedDatasetName: null,
};
