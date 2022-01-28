import React from 'react';

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

  const [main, setMain] = React.useState('');
  const [which, setWhich] = React.useState('pre');
  const [data, setData] = React.useState({ rows: [] });
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
    // const setData = (d) => dispatch(setConnectionsPanelData(d));
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
  }, [main, which, neuPrintManager, mergeManager, addAlert]);

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
    <div style={{ width: '100%' }}>
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
