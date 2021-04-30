import React from 'react';
import PropTypes from 'prop-types';
import TableRow from '@material-ui/core/TableRow';
import IconButton from '@material-ui/core/IconButton';
import DoneIcon from '@material-ui/icons/DoneAllTwoTone';
import RevertIcon from '@material-ui/icons/NotInterestedOutlined';
import { TableCell } from '@material-ui/core';
// import Box from '@material-ui/core/Box';

import DataCellEdit from './DataCellEdit';

export default function DataEdit(props) {
  const {
    takeChange, cancelEdit, config, data,
  } = props;

  const dataForEditing = {};
  config.columns.forEach((column) => {
    if (column.editElement && data[column.field] !== undefined) {
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

  const columnToCell = (column) => {
    if (column.cell) {
      return column.cell;
    }

    if (column.field === '#toolColumn') {
      const children = [
        <IconButton
          key="DataEdit.Done"
          aria-label="ok"
          disabled={!isNewDataValid() || !hasChanged()}
          onClick={() => takeChange(newData)}
        >
          <DoneIcon />
        </IconButton>,
        <IconButton
          key="DataEdit.Cancel"
          aria-label="cancel"
          onClick={cancelEdit}
        >
          <RevertIcon />
        </IconButton>,
      ];
      return column.makeCell(children);
    }

    if (column.editElement) {
      return (
        <TableCell key={column.field}>
          <DataCellEdit
            config={column.editElement}
            onValueChange={
              (value) => {
                setNewData({ ...newData, [column.field]: value });
              }
            }
            value={data[column.field]}
            placeholder={column.placeholder}
          />
        </TableCell>
      );
    }

    return (
      <TableCell key={column.field}>
        {data[column.field]}
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
  data: PropTypes.object.isRequired,
  takeChange: PropTypes.func.isRequired,
  cancelEdit: PropTypes.func.isRequired,
};
