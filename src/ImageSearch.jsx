import React, { useState } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import {
  Link as RouterLink,
  Route,
  Switch,
  useRouteMatch,
} from 'react-router-dom';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import ByExampleResults from './ImageSearch/ByExampleResults';
import TransferResults from './ImageSearch/TransferResults';
import SavedSearches from './ImageSearch/SavedSearches';
import NGLoader from './ImageSearch/NGLoader';

const initialCoordinates = []; // [24646, 15685, 17376];

const keyboardText = /Mac/.test(navigator.platform) ? 'option' : 'alt';

const useStyles = makeStyles({
  window: {
    width: '100%',
    margin: 'auto',
    height: '500px',
  },
  header: {
    margin: '1em',
  },
  matches: {
    margin: '1em',
  },
  alpha: {
    fontSize: '0.8em',
    color: '#aaa',
    verticalAlign: 'super',
  },
});

// eslint-disable-next-line object-curly-newline
export default function ImageSearch({ actions, datasets, selectedDatasetName, children }) {
  const dataset = datasets.filter((ds) => ds.name === selectedDatasetName)[0];
  const projectUrl = useSelector((state) => state.clio.get('projectUrl'), shallowEqual);
  const classes = useStyles();
  const [pickMode, setPickMode] = useState(0);
  const [transferModel, setTransferModel] = useState(0);
  const [mousePosition, setMousePosition] = useState(initialCoordinates);
  const { path, url } = useRouteMatch();

  const updatedActions = { ...actions, setMousePosition };

  React.useEffect(() => {
    setMousePosition([]);
  }, [selectedDatasetName]);

  const handleChange = (event) => {
    // make sure the mouse position gets cleared out so that we don't
    // try to load the data at that point when switching pick modes
    setMousePosition([]);
    setPickMode(parseInt(event.target.value, 10));
  };

  const handleTransferChange = (event) => {
    // make sure the mouse position gets cleared out so that we don't
    // try to load the data at that point when switching transfer models
    setMousePosition([]);
    setTransferModel(event.target.value);
  };

  const callbacks = [
    {
      name: 'coords',
      event: 'alt+click0',
      function: (e) => {
        setMousePosition([...e.mouseState.position]);
      },
    },
  ];

  const childrenWithMoreProps = React.Children.map(
    children,
    (child) => React.cloneElement(child, { callbacks }, null),
  );

  let results = <p>Please select a dataset.</p>;

  if (dataset) {
    if (pickMode === 1 && dataset && 'transfer' in dataset) {
      results = (
        <TransferResults
          model={dataset.transfer[transferModel]}
          mousePosition={mousePosition}
          dataset={dataset}
          projectUrl={projectUrl}
        />
      );
    } else {
      results = (
        <ByExampleResults
          mousePosition={mousePosition}
          projectUrl={projectUrl}
          actions={actions}
          dataset={dataset}
        />
      );
    }
  }

  let modelSelect = '';

  if (pickMode === 1 && dataset && 'transfer' in dataset) {
    const modelSelectItems = dataset.transfer.map((model, i) => (
      <MenuItem key={model} value={i}>
        {model}
      </MenuItem>
    ));

    modelSelect = (
      <FormControl variant="outlined" className={classes.formControl}>
        <InputLabel id="transfer-model-label">Model</InputLabel>
        <Select
          labelId="transfer-model-label"
          id="transfer-model"
          value={transferModel}
          onChange={handleTransferChange}
          label="Model"
        >
          {modelSelectItems}
        </Select>
      </FormControl>
    );
  }

  return (
    <div>
      <div className={classes.header}>
        <Grid container spacing={3}>
          <Grid item sm={10}>
            <Typography variant="h5">
              Image Search <span className={classes.alpha}>alpha</span>
            </Typography>
          </Grid>
          <Grid item sm={2}>
            <Switch>
              <Route exact path={path}>
                <Link component={RouterLink} to={`${url}/saved_searches`}>
                  <Typography variant="h5">Saved Searches &raquo;</Typography>
                </Link>
              </Route>
              <Route path={`${path}/saved_searches`}>
                <Link component={RouterLink} to={`${url}`}>
                  <Typography variant="h5">&laquo; Back</Typography>
                </Link>
              </Route>
            </Switch>
          </Grid>
        </Grid>
      </div>
      <Switch>
        <Route exact path={path}>
          {dataset && dataset.transfer && (
            <FormControl component="fieldset">
              <FormLabel component="legend">Pick Mode</FormLabel>
              <RadioGroup
                row
                aria-label="pick_mode"
                name="pick_mode"
                value={pickMode}
                onChange={handleChange}
              >
                <FormControlLabel
                  value={0}
                  control={<Radio color="primary" />}
                  label="Query by Example"
                />
                <FormControlLabel
                  value={1}
                  control={<Radio color="primary" />}
                  label="Apply Transfer Network"
                />
              </RadioGroup>
            </FormControl>
          )}
          {modelSelect}
          {dataset ? (
            <NGLoader dataset={dataset} actions={actions} coords={mousePosition}>
              {childrenWithMoreProps}
            </NGLoader>
          ) : (
            ''
          )}
          <Alert severity="info">
            To locate new  matches use neuroglancer to navigate to a region
            of interest and <span className="kbd">{keyboardText}</span>+ &apos;click&apos;
            on the point you are interested in.
          </Alert>
          { mousePosition.length > 0 ? <div className={classes.matches}>{results}</div> : '' }
        </Route>
        <Route path={`${path}/saved_searches`}>
          {dataset && <SavedSearches dataset={dataset} actions={updatedActions} />}
        </Route>
      </Switch>
    </div>
  );
}

ImageSearch.propTypes = {
  actions: PropTypes.object.isRequired,
  datasets: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedDatasetName: PropTypes.string.isRequired,
  children: PropTypes.object.isRequired,
};
