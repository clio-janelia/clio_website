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

  const editButton = (
    <IconButton onClick={handleEditClicked}>
      <EditIcon />
    </IconButton>
  );

  return (
    <TableRow>
      <TableCell>
        {row.locate ? locateButton : undefined}
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
        {row.updateAction ? editButton : undefined}
      </TableCell>
    </TableRow>
  );
}

DataTableRow.propTypes = {
  config: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.shape({
      field: PropTypes.string,
      title: PropTypes.string,
      filterEnabled: PropTypes.bool,
    })),
  }).isRequired,
  row: PropTypes.object.isRequired, // Row data with a shape specified in column settings
  selected: PropTypes.bool,
};

DataTableRow.defaultProps = {
  selected: false,
};

export default DataTableRow;
