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

  const [confirmationOpen, setConfirmationOpen] = React.useState(false);

  const handleConfirmationOK = () => {
    mergeManager.clear();
    setConfirmationOpen(false);
  };
  const handleConfirmationCancel = () => setConfirmationOpen(false);

  const onClickButtonMerge = () => mergeManager.merge();
  const onClickButtonUnmerge = () => mergeManager.unmerge();
  const onClickButtonClear = () => {
    if (Object.keys(mergeManager.mainToOthers).length > 0) {
      setConfirmationOpen(true);
    }
  };
  const onClickButtonPullRequest = () => {
    // TODO: Support pull requests.
    const message = 'Pull requests are not yet supported.';
    mergeManager.actions.addAlert({ severity: 'warning', message });
  };

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

      <DataTable data={data} config={DATA_TABLE_CONFIG} getId={(row) => row.id} />

      <Dialog open={confirmationOpen} disableEnforceFocus>
        <DialogContent>
          <DialogContentText>Clear all local merges?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmationOK} color="primary">OK</Button>
          <Button autoFocus onClick={handleConfirmationCancel} color="primary">Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

MergePanel.propTypes = {
  mergeManager: PropTypes.object.isRequired,
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
  if (layer.name.toLowerCase().includes('segmentation')) {
    const selectionStrings = segments.toJSON();
    const selectionNow = selectionStrings.map((s) => parseInt(s, 10));
    mergeManager.select(selectionNow);
  }
}

export { MergePanel, onKeyPressMerge, onVisibleChangedMerge };
