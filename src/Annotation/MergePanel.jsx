import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import PropTypes from 'prop-types';
import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import { makeStyles } from '@material-ui/core/styles';
import DataTable from './DataTable/DataTable';
import { getLayerFromDataset, isMergeableLayer } from '../utils/neuroglancer';
import './MergePanel.css';

const useStyles = makeStyles((theme) => ({
  spaced: {
    marginLeft: '15px',
  },
  mergeControlRow: {
    display: 'flex',
    flexFlow: 'row',
    backgroundColor: theme.palette.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '0px',
  },
}));

const KEY_BINDINGS = Object.freeze({
  MERGE: 'm',
  UNMERGE: 'M',
});

const DATA_TABLE_CONFIG = {
  columns: [
    {
      title: 'Main',
      field: 'main',
      filterEnabled: true,
      /* TODO: Add something like this to report an error, like a missing ID:
      style: { color: 'red' },
      */
    },
    {
      title: 'Merged Onto Main',
      field: 'others',
      filterEnabled: true,
    },
  ],
};

function MergePanel(props) {
  const classes = useStyles();
  const { mergeManager } = props;

  const [data, setData] = React.useState({ rows: [] });

  const updateTable = React.useCallback(() => {
    const newData = [];
    Object.entries(mergeManager.mainToOthers).map(([m, o]) => (
      newData.push({
        main: m,
        others: o.join(', '),
        id: m,
        locateAction: () => {
          mergeManager.select([parseInt(m, 10)]);
          mergeManager.actions.setViewerSegments([parseInt(m, 10)]);
        },
        locateStyle: mergeManager.otherToMain[m] ? { color: 'GoldenRod' } : null,
        locateTooltip: mergeManager.otherToMain[m] ? `Selects ${mergeManager.getUltimateMain(m)}` : '',
        deleteAction: () => {
          mergeManager.select([parseInt(m, 10)]);
          mergeManager.unmerge();
        },
      })
    ));
    setData({ rows: newData });
  }, [mergeManager]);

  React.useEffect(() => {
    mergeManager.onMergeChanged = () => {
      updateTable();
    };
    updateTable();
  }, [mergeManager, updateTable]);

  const [clearConfirmationOpen, setClearConfirmationOpen] = React.useState(false);
  const handleClearConfirmationOK = () => {
    mergeManager.clear();
    setClearConfirmationOpen(false);
  };
  const handleClearConfirmationCancel = () => setClearConfirmationOpen(false);

  const [pullRequestConfirmationOpen, setPullRequestConfirmationOpen] = React.useState(false);
  const handlePullRequestConfirmationOK = () => {
    setPullRequestConfirmationOpen(false);
    mergeManager.pullRequest()
      .then(() => {
        const message = 'Pull request submitted.';
        props.addAlert({ severity: 'info', message });
      });
  };
  const handlePullRequestConfirmationCancel = () => setPullRequestConfirmationOpen(false);

  const onClickButtonMerge = () => mergeManager.merge();
  const onClickButtonUnmerge = () => mergeManager.unmerge();
  const onClickButtonClear = () => {
    if (Object.keys(mergeManager.mainToOthers).length > 0) {
      setClearConfirmationOpen(true);
    }
  };
  const onClickButtonPullRequest = () => setPullRequestConfirmationOpen(true);

  return (
    <div>
      <div className={classes.mergeControlRow}>
        <Tooltip title={`Keyboard shortcut: "${KEY_BINDINGS.MERGE}"`}>
          <Button color="primary" variant="contained" onClick={onClickButtonMerge}>Merge</Button>
        </Tooltip>
        <Tooltip title={`Keyboard shortcut: "${KEY_BINDINGS.UNMERGE}"`}>
          <Button color="primary" variant="contained" onClick={onClickButtonUnmerge}>Unmerge</Button>
        </Tooltip>
        <Button color="primary" variant="contained" onClick={onClickButtonClear}>Clear</Button>
        <Button color="primary" variant="contained" onClick={onClickButtonPullRequest}>Pull Request</Button>
      </div>

      <DataTable
        data={data}
        config={DATA_TABLE_CONFIG}
        getId={React.useCallback((row) => row.id, [])}
      />

      <Dialog open={clearConfirmationOpen} disableEnforceFocus>
        <DialogContent>
          <DialogContentText>Clear all local merges?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearConfirmationOK} color="primary">OK</Button>
          <Button autoFocus onClick={handleClearConfirmationCancel} color="primary">Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={pullRequestConfirmationOpen} disableEnforceFocus>
        <DialogContent>
          <DialogContentText>
            Submit a pull request to include local merges in the next data release?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePullRequestConfirmationOK} color="primary">OK</Button>
          <Button autoFocus onClick={handlePullRequestConfirmationCancel} color="primary">Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

MergePanel.propTypes = {
  mergeManager: PropTypes.object.isRequired,
  addAlert: PropTypes.func.isRequired,
};

function onKeyPressMerge(event, mergeManager) {
  if (event.key === KEY_BINDINGS.MERGE) {
    mergeManager.merge();
    return true;
  }
  if (event.key === KEY_BINDINGS.UNMERGE) {
    mergeManager.unmerge();
    return true;
  }
  return false;
}

// Neuroglancer's notion of "visible" corresponds to other applications' notion of "selected".
function onVisibleChangedMerge(segments, layer, mergeManager) {
  // Need to make sure that 'backend' is ready before retrieving the dataset
  if (mergeManager.backend) {
    const { dataset } = mergeManager.backend;
    const datasetLayer = dataset && getLayerFromDataset(dataset, layer.name);
    const mergeable = datasetLayer && isMergeableLayer(dataset, layer.name);
    if (mergeable) {
      const selectionStrings = segments.toJSON();
      const selectionNow = selectionStrings.map((s) => parseInt(s, 10));
      mergeManager.select(selectionNow);
    }
  }
}

export { MergePanel, onKeyPressMerge, onVisibleChangedMerge };
