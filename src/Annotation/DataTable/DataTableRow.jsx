import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/DeleteOutlined';
import EditIcon from '@material-ui/icons/EditOutlined';
import LocateIcon from '@material-ui/icons/RoomOutlined';
import LocateIconSelected from '@material-ui/icons/Room';
import ReportProblemIcon from '@material-ui/icons/ReportProblem';
import Tooltip from '@material-ui/core/Tooltip';
import DataEdit from './DataEdit';

function DataTableRow(props) {
  const {
    config, row, selected, getLocateIcon,
  } = props;

  const isValid = config.columns.every((column) => {
    if (column.checkValidity) {
      return column.checkValidity(row[column.field]);
    }
    return true;
  });

  const isValidAfterChange = (change) => (
    config.columns.every((column) => {
      if (column.checkValidity) {
        let value = row[column.field];
        if (column.field in change) {
          value = change[column.field];
        }
        return column.checkValidity(value);
      }
      return true;
    })
  );

  const [editing, setEditing] = useState(!isValid);

  const handleEditClicked = () => {
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const takeChange = (change) => {
    if (isValidAfterChange(change)) {
      row.updateAction(change);
      setEditing(false);
    }
  };

  const getDefaultLocateIcon = () => (selected ? <LocateIconSelected /> : <LocateIcon />);

  const locateButtonWithoutTooptip = (
    <IconButton
      onClick={row.locateAction}
      style={(selected && row.locateStyle) ? row.locateStyle : null}
    >
      {getLocateIcon ? getLocateIcon(row, selected) : getDefaultLocateIcon()}
    </IconButton>
  );

  const locateButton = row.locateTooltip
    ? (
      <Tooltip title={row.locateTooltip}>
        {locateButtonWithoutTooptip}
      </Tooltip>
    ) : locateButtonWithoutTooptip;

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

  const deleteButton = (
    <IconButton onClick={row.deleteAction}>
      <DeleteIcon />
    </IconButton>
  );

  const getCellElement = (column) => {
    const value = row[column.field];
    if (column.checkValidity) {
      let errorHint = '';
      if (!column.checkValidity(value, (error) => {
        errorHint = error;
      })) {
        return (
          <Tooltip title={errorHint} style={{ color: 'orange' }}>
            <IconButton onClick={handleEditClicked}>
              <ReportProblemIcon />
            </IconButton>
          </Tooltip>
        );
      }
    }

    return value;
  };

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
          style={column.style}
        >
          {getCellElement(column)}
        </TableCell>
      ))}
      <TableCell>
        <Box display="flex" flexDirection="row">
          {row.updateAction ? editButton : undefined}
          {row.deleteAction ? deleteButton : undefined}
        </Box>
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
  getLocateIcon: PropTypes.func,
};

DataTableRow.defaultProps = {
  selected: false,
  getLocateIcon: undefined,
};

export default DataTableRow;
