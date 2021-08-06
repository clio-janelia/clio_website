import React from 'react';
import PropTypes from 'prop-types';
import TableRow from '@material-ui/core/TableRow';
import IconButton from '@material-ui/core/IconButton';
import DoneIcon from '@material-ui/icons/DoneAllTwoTone';
import RevertIcon from '@material-ui/icons/NotInterestedOutlined';
import TableCell from '@material-ui/core/TableCell';

import DataCellEdit from './DataCellEdit';
import {
  useStyles,
} from './DataTableUtils';

const sameValue = (a, b, defaultValue = undefined) => {
  const v1 = a === undefined ? defaultValue : a;
  const v2 = b === undefined ? defaultValue : b;

  if (typeof v1 !== typeof v2) {
    return false;
  }

  if ((v1 === v2)
    || (JSON.stringify(v1) === JSON.stringify(v2))) {
    return true;
  }

  return false;
};

const getDefaultValue = (columns, field, data) => {
  const column = columns.find((c) => c.field === field);
  if (column) {
    if (column.defaultValue !== undefined) {
      return column.defaultValue;
    }

    const editElement = column.getEditElement ? column.getEditElement(data) : column.editElement;

    if (editElement) {
      switch (editElement.type) {
        case 'point':
        case 'list':
          return [];
        case 'checkbox':
          return false;
        default:
          return '';
      }
    }
  }

  return '';
};

export default function DataEdit(props) {
  const {
    takeChange, cancelEdit, config, defaultData,
  } = props;

  const classes = useStyles();

  const [dataChange, setDataChange] = React.useState({});

  const isFieldValid = React.useCallback((field, value) => {
    let column = null;
    if (config.validitingColumns) {
      column = config.validitingColumns[field];
    } else {
      column = config.columns.find((c) => (c.field === field));
    }
    if (column) {
      if (column.checkValidity) {
        return column.checkValidity(value);
      }
      return true;
    }

    return false;
  }, [config]);

  const isDataValid = React.useCallback(() => (
    Object.keys(dataChange).every((field) => isFieldValid(field, dataChange[field]))
  ), [dataChange, isFieldValid]);

  const hasChanged = React.useCallback(() => {
    console.debug(dataChange);
    return Object.keys(dataChange).length > 0;
  }, [dataChange]);

  const handleValueChange = React.useCallback((field, value) => {
    setDataChange((prevDataChange) => {
      const newDataChange = { ...prevDataChange, [field]: value };
      if (sameValue(
        defaultData[field],
        value,
        getDefaultValue(config.columns, field, defaultData),
      )) {
        delete newDataChange[field];
      }
      return newDataChange;
    });
  }, [defaultData, config.columns]);

  const columnToCell = (column) => {
    if (column.cell) {
      return column.cell;
    }

    if (column.field === '#toolColumn') {
      const children = [
        <IconButton
          className={classes.tableRowIcon}
          key="DataEdit.Done"
          aria-label="ok"
          disabled={!isDataValid() || !hasChanged()}
          onClick={() => takeChange(dataChange)}
        >
          <DoneIcon />
        </IconButton>,
        <IconButton
          className={classes.tableRowIcon}
          key="DataEdit.Cancel"
          aria-label="cancel"
          onClick={cancelEdit}
        >
          <RevertIcon />
        </IconButton>,
      ];
      return column.makeCell(children);
    }

    if (column.editElement || column.getEditElement) {
      let { editElement } = column;
      if (column.getEditElement) {
        editElement = column.getEditElement(defaultData);
      }
      return (
        <TableCell key={column.field}>
          <DataCellEdit
            field={column.field}
            config={editElement}
            onValueChange={handleValueChange}
            value={
              (column.field in dataChange) ? dataChange[column.field] : defaultData[column.field]
            }
            placeholder={column.placeholder}
          />
        </TableCell>
      );
    }

    return (
      <TableCell key={column.field}>
        {defaultData[column.field]}
      </TableCell>
    );
  };

  return (
    <TableRow>
      {config.columns.map((column) => columnToCell(column))}
    </TableRow>
  );
}

DataEdit.propTypes = {
  config: PropTypes.object.isRequired,
  defaultData: PropTypes.object.isRequired,
  takeChange: PropTypes.func.isRequired,
  cancelEdit: PropTypes.func.isRequired,
};
