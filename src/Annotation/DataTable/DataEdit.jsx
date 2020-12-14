import React from 'react';
import PropTypes from 'prop-types';
import TableRow from '@material-ui/core/TableRow';
import IconButton from '@material-ui/core/IconButton';
import DoneIcon from '@material-ui/icons/DoneAllTwoTone';
import RevertIcon from '@material-ui/icons/NotInterestedOutlined';
import { TableCell } from '@material-ui/core';
import DataCellEdit from './DataCellEdit';

export default function DataEdit(props) {
  const change = {};

  const {
    takeChange, cancelEdit, config, data,
  } = props;

  const columnToCell = (column) => {
    if (column.cell) {
      return column.cell;
    }

    return column.filterEnabled ? (
      <DataCellEdit
        config={column}
        onValueChange={
          (value) => {
            change[column.field] = value;
          }
        }
        value={data[column.field]}
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
          onClick={() => takeChange(change)}
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
