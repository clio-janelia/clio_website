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

  const { config, data } = props;

  const handleEditClicked = () => {
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const takeChange = (change) => {
    data.updateAction(change);
    setEditing(false);
  };

  const locateButton = (
    <IconButton onClick={data.locate}>
      <LocateIcon />
    </IconButton>
  );

  let tableRow = (
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
          {data[column.field]}
        </TableCell>
      ))}
      <TableCell>
        <IconButton onClick={data.deleteAction}>
          <DeleteIcon />
        </IconButton>
        <IconButton onClick={handleEditClicked}>
          <EditIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );

  if (editing) {
    tableRow = (
      <DataEdit
        config={
          {
            columns: [{ cell: locateButton, field: '#locateButton' }, ...config.columns],
          }
        }
        data={data}
        cancelEdit={cancelEdit}
        takeChange={takeChange}
      />
    );
  }

  return tableRow;
}

DataTableRow.propTypes = {
  config: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
};

export default DataTableRow;
