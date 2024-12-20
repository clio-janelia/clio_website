import React from 'react';
import PropTypes from 'prop-types';
import TableRow from '@material-ui/core/TableRow';
import IconButton from '@material-ui/core/IconButton';
import DoneIcon from '@material-ui/icons/DoneAllTwoTone';
import RevertIcon from '@material-ui/icons/NotInterestedOutlined';
import TableCell from '@material-ui/core/TableCell';

import DataCellEdit from './DataCellEdit';
import {
  FIELD_PROP_TYPES,
  useStyles,
} from './DataTableUtils';

const sameValue = (a, b, defaultValue = undefined) => {
  const v1 = a === undefined ? defaultValue : a;
  const v2 = b === undefined ? defaultValue : b;

  if (typeof v1 !== typeof v2) {
    return false;
  }

  return ((v1 === v2)
    || (JSON.stringify(v1) === JSON.stringify(v2)));
};

const getEditElement = (column, data) => {
  if (column) {
    if (column.getEditElement) {
      return column.getEditElement(data);
    }
    if (column.editElement) {
      const { editElement } = column;
      if (column.jsonSchema) {
        if (column.jsonSchema.type === 'integer' && editElement.type === 'input') {
          editElement.type = 'integer';
        }
      }
      return editElement;
    }
  }

  return undefined;
};

const getDefaultValue = (column, data) => {
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
        case 'integer':
          return undefined;
        default:
          return '';
      }
    }
  }

  return '';
};

export default function DataEdit(props) {
  const {
    onConfirmChange, onCancelEdit, config, defaultData,
  } = props;

  const classes = useStyles();

  const [dataChange, setDataChange] = React.useState({});

  const isFieldValid = React.useCallback((field, value) => {
    let column = null;
    column = config.columns.find((c) => (c.field === field));
    if (column) {
      if (column.validate) {
        return column.validate(value);
      }
      return true;
    }

    return false;
  }, [config]);

  const isDataValid = React.useCallback(() => (
    Object.keys(dataChange).every((field) => isFieldValid(field, dataChange[field]))
  ), [dataChange, isFieldValid]);

  const hasChanged = React.useCallback(() => Object.keys(dataChange).length > 0, [dataChange]);

  const handleConfirmChange = (changes) => {
    onConfirmChange(changes);
  };

  const handleValueChange = React.useCallback((field, value) => {
    // if the value is undefined, set it to null.
    // We have to do this, because the backend is expecting a null value
    // for items that have been deleted. If we send undefined, the backend
    // will ignore the key and the item will not be deleted.
    const fieldValue = value === undefined ? null : value;

    setDataChange((prevDataChange) => {
      const column = config.columns.find((c) => c.field === field);
      const newDataChange = { ...prevDataChange, [field]: fieldValue };
      // if the value is the same as the default value, remove it from the change list
      if (sameValue(
        defaultData[field],
        fieldValue,
        getDefaultValue(column, defaultData),
      )) {
        delete newDataChange[field];
      }
      // if the new values is null and the old value was undefined,
      // remove it from the change list. If we don't do this, the backend
      // will update user and timestamp for the item, even though the value
      // has not changed.
      if (fieldValue === null && defaultData[field] === undefined) {
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
          onClick={() => handleConfirmChange(dataChange)}
        >
          <DoneIcon />
        </IconButton>,
        <IconButton
          className={classes.tableRowIcon}
          key="DataEdit.Cancel"
          aria-label="cancel"
          onClick={onCancelEdit}
        >
          <RevertIcon />
        </IconButton>,
      ];
      return column.makeCell(children);
    }

    if (column.editElement || column.getEditElement) {
      const editElement = getEditElement(column, defaultData);
      // let { editElement } = column;
      // if (column.getEditElement) {
      //   editElement = column.getEditElement(defaultData);
      // }
      return (
        <TableCell key={column.field}>
          <DataCellEdit
            config={column}
            onValueChange={handleValueChange}
            defaultValue={defaultData[column.field]}
            editElement={editElement}
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
  config: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.shape(FIELD_PROP_TYPES)).isRequired,
  }).isRequired,
  defaultData: PropTypes.object.isRequired,
  onConfirmChange: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
};
