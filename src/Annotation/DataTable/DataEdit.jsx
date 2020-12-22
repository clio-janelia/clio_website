import React from 'react';
import PropTypes from 'prop-types';
import TableRow from '@material-ui/core/TableRow';
import IconButton from '@material-ui/core/IconButton';
import DoneIcon from '@material-ui/icons/DoneAllTwoTone';
import RevertIcon from '@material-ui/icons/NotInterestedOutlined';
import { TableCell } from '@material-ui/core';
import DataCellEdit from './DataCellEdit';

export default function DataEdit(props) {
  const {
    takeChange, cancelEdit, config, data,
  } = props;

  const dataForEditing = {};
  config.columns.forEach((column) => {
    if (column.editElement) {
      dataForEditing[column.field] = data[column.field];
    }
  });

  const [newData, setNewData] = React.useState(dataForEditing);

  const isFieldValid = React.useCallback((field, value) => {
    const column = config.columns.find((c) => (c.field === field));
    if (column) {
      if (column.checkValidity) {
        return column.checkValidity(value);
      }
      return true;
    }

    return false;
  }, [config]);

  const isNewDataValid = React.useCallback(() => (
    Object.keys(newData).every((field) => isFieldValid(field, newData[field]))
  ), [newData, isFieldValid]);

  const hasChanged = React.useCallback(() => (
    Object.keys(newData).some((field) => dataForEditing[field] !== newData[field])
  ), [newData, dataForEditing]);

  console.log(isNewDataValid());

  const columnToCell = (column) => {
    if (column.cell) {
      return column.cell;
    }

    return (column.editElement && column.editElement.type === 'input') ? (
      <DataCellEdit
        config={column}
        onValueChange={
          (value) => {
            const changed = { ...newData };
            changed[column.field] = value;
            setNewData(changed);
          }
        }
        value={data[column.field]}
        placeholder={column.placeholder}
      />
    ) : null;
  };

  return (
    <TableRow>
      {config.columns.map((column) => (
        <TableCell key={column.field}>
          {columnToCell(column)}
        </TableCell>
      ))}
      <TableCell>
        <IconButton
          aria-label="ok"
          disabled={!isNewDataValid() || !hasChanged()}
          onClick={() => takeChange(newData)}
        >
          <DoneIcon />
        </IconButton>
        <IconButton
          aria-label="cancel"
          onClick={cancelEdit}
        >
          <RevertIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

DataEdit.propTypes = {
  config: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
  takeChange: PropTypes.func.isRequired,
  cancelEdit: PropTypes.func.isRequired,
};
