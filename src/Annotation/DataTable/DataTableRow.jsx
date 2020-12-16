import React, { useState } from 'react';
import PropTypes from 'prop-types';

import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/DeleteOutlined';
import EditIcon from '@material-ui/icons/EditOutlined';
import LocateIcon from '@material-ui/icons/RoomOutlined';
import DataEdit from './DataEdit';

function DataTableRow(props) {
  const [editing, setEditing] = useState(false);

  const { config, row, selected } = props;

  const handleEditClicked = () => {
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const takeChange = (change) => {
    row.updateAction(change);
    setEditing(false);
  };

  const locateButton = (
    <IconButton onClick={row.locate} style={selected ? { color: 'red' } : null}>
      <LocateIcon />
    </IconButton>
  );

  if (editing) {
    return (
      <DataEdit
        config={
          {
            columns: [{ cell: locateButton, field: '#locateButton' }, ...config.columns],
          }
        }
        data={row}
        cancelEdit={cancelEdit}
        takeChange={takeChange}
      />
    );
  }

  return (
    <TableRow>
      <TableCell>
        {locateButton}
      </TableCell>
      {config.columns.map((column) => (
        <TableCell
          key={column.field}
          align={column.align}
          component="th"
          scope="row"
        >
          {row[column.field]}
        </TableCell>
      ))}
      <TableCell>
        <IconButton onClick={row.deleteAction}>
          <DeleteIcon />
        </IconButton>
        <IconButton onClick={handleEditClicked}>
          <EditIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

DataTableRow.propTypes = {
  config: PropTypes.object.isRequired,
  row: PropTypes.object.isRequired,
  selected: PropTypes.bool,
};

DataTableRow.defaultProps = {
  selected: false,
};

export default DataTableRow;
