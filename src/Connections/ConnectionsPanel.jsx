import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { makeStyles } from '@material-ui/core/styles';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import TextField from '@material-ui/core/TextField';
import PropTypes from 'prop-types';
import DataTable from '../Annotation/DataTable/DataTable';
import mergeConnectionRows from './ConnectionsUtils';
import { setConnectionsPanelData, setConnectionsPanelMain, setConnectionsPanelWhich } from '../actions/connectionsPanel';

const useStyles = makeStyles((theme) => ({
  spaced: {
    marginLeft: '15px',
  },
  controlRow: {
    display: 'flex',
    flexFlow: 'row',
    backgroundColor: theme.palette.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '0px',
  },
}));

const DATA_TABLE_CONFIG = {
  columns: [
    {
      title: 'Partner',
      field: 'partner',
      filterEnabled: true,
    },
    {
      title: 'Type',
      field: 'type',
      filterEnabled: true,
    },
    {
      title: '#Connections',
      field: 'numConnections',
    },
  ],
};

export default function ConnectionsPanel(props) {
  const { neuPrintManager, mergeManager, addAlert } = props;
  const classes = useStyles();

  // Use Redux instead of `React.useState` for `main`, `which` and `data` so
  // heir values will be retaned when the user goes to another tab and then
  // returns to this tab.

  const dispatch = useDispatch();

  const main = useSelector((state) => state.connectionsPanel.getIn(['main']));
  const setMain = (m) => dispatch(setConnectionsPanelMain(m));

  const which = useSelector((state) => state.connectionsPanel.getIn(['which']));
  const setWhich = (w) => dispatch(setConnectionsPanelWhich(w));

  const data = useSelector((state) => state.connectionsPanel.getIn(['data']));

  const [selected, setSelected] = React.useState(false);
  const [updated, setUpdated] = React.useState(false);

  React.useEffect(() => {
    mergeManager.onSelectionChanged = () => {
      setSelected(mergeManager.selection.length > 0);
    };
    setSelected(mergeManager.selection.length > 0);
    return (() => { mergeManager.onSelectionChanged = undefined; });
  }, [mergeManager]);

  const updateTable = React.useCallback(() => {
    const setData = (d) => dispatch(setConnectionsPanelData(d));
    const ids = mergeManager.expand([main]);
    neuPrintManager.getConnections(ids, which)
      .then((connections) => {
        if (connections) {
          const mergedConnections = mergeConnectionRows(connections, mergeManager);
          const newData = [];
          mergedConnections.map((item) => (
            newData.push({
              partner: item.id,
              type: item.type || '',
              numConnections: item.weight,
              id: item.id,
              locateAction: () => {
                mergeManager.select([parseInt(item.id, 10)]);
                mergeManager.actions.setViewerSegments([parseInt(item.id, 10)]);
              },
            })
          ));
          setData({ rows: newData });
          setUpdated(true);
        }
      }).catch((err) => {
        addAlert({ severity: 'error', message: err.message });
      });
  }, [main, which, neuPrintManager, mergeManager, addAlert, dispatch]);

  const onClickButtonSelected = () => {
    if (mergeManager.selection.length > 0) {
      setMain(mergeManager.selection[0]);
      setUpdated(false);
    }
  };

  const onClickButtonUpdate = () => {
    updateTable();
  };

  const onKeyDownMain = (event) => {
    setUpdated(false);
    if (event.key === 'Enter') {
      updateTable();
    }
  };

  const onChangeMain = (event) => {
    setMain(event.target.value);
    setUpdated(false);
  };

  const onChangeRadio = (event) => {
    setWhich(event.target.value);
    setUpdated(false);
  };

  return (
    <div>
      <div className={classes.controlRow}>
        <TextField
          onKeyDown={onKeyDownMain}
          onChange={onChangeMain}
          value={main}
          placeholder="Main ID"
        />
        <Button
          className={classes.spaced}
          color="primary"
          variant="contained"
          onClick={onClickButtonSelected}
          disabled={!selected}
        >
          Selected
        </Button>
      </div>
      <div className={classes.controlRow}>
        <FormControl component="fieldset">
          <RadioGroup row value={which} onChange={onChangeRadio}>
            <FormControlLabel
              label="Post (inputs)"
              control={<Radio />}
              value="post"
            />
            <FormControlLabel
              label="Pre (outputs)"
              control={<Radio />}
              value="pre"
            />
          </RadioGroup>
        </FormControl>
        <Button
          color="primary"
          variant="contained"
          onClick={onClickButtonUpdate}
          disabled={updated}
        >
          Update
        </Button>
      </div>
      <DataTable data={data} config={DATA_TABLE_CONFIG} getId={(row) => row.id} />
    </div>
  );
}

ConnectionsPanel.propTypes = {
  neuPrintManager: PropTypes.object.isRequired,
  mergeManager: PropTypes.object.isRequired,
  addAlert: PropTypes.func.isRequired,
};
