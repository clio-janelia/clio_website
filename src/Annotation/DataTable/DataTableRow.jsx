import React, { useState } from 'react';
import PropTypes from 'prop-types';
import DeleteIcon from '@material-ui/icons/DeleteOutlined';
import EditIcon from '@material-ui/icons/EditOutlined';
import IconButton from '@material-ui/core/IconButton';
import LocateIcon from '@material-ui/icons/RoomOutlined';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import DataEdit from './DataEdit';

function DataTableRow(props) {
  const { config, row, selected } = props;

  const isValid = () => (
    config.columns.every((column) => {
      if (column.checkValidity) {
        return column.checkValidity(row[column.field]);
      }
      return true;
    })
  );

  const [editing, setEditing] = useState(!isValid());

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
    <Tooltip title={row.locateTooltip}>
      <IconButton onClick={row.locateAction} style={selected ? { color: 'red' } : row.locateStyle}>
        <LocateIcon />
      </IconButton>
    </Tooltip>
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
        {row.locateAction ? locateButton : undefined}
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
