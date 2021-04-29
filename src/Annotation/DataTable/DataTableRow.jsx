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
import {
  getVisibleColumns,
  getColumnSetting,
  getColumnFields,
  COLUMNS_PROP_TYPES,
} from './DataTableUtils';

function DataTableRow(props) {
  const {
    columns, row, selected, getLocateIcon,
  } = props;

  const allColumnFields = getColumnFields(columns);
  const isValid = allColumnFields.every((field) => {
    const column = getColumnSetting(columns, field);
    if (column.checkValidity) {
      return column.checkValidity(row[column.field]);
    }
    return true;
  });

  const isValidAfterChange = (change) => allColumnFields.every((field) => {
    const column = getColumnSetting(columns, field);
    if (column.checkValidity) {
      let value = row[column.field];
      if (column.field in change) {
        value = change[column.field];
      }
      return column.checkValidity(value);
    }
    return true;
  });

  const [editing, setEditing] = useState(!isValid || row.defaultEditing);

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

  const visibleColumns = getVisibleColumns(columns);
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
            columns: [{ cell: locateButton, field: '#locateButton' }, ...visibleColumns],
          }
        }
        data={row}
        cancelEdit={cancelEdit}
        takeChange={takeChange}
      />
    );
  }

  const editButton = (
    <Tooltip enterDelay={500} title="Edit">
      <IconButton onClick={handleEditClicked}>
        <EditIcon />
      </IconButton>
    </Tooltip>
  );

  const deleteButton = (
    <Tooltip enterDelay={500} title="Delete">
      <IconButton onClick={row.deleteAction}>
        <DeleteIcon />
      </IconButton>
    </Tooltip>
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

    if (typeof value === 'boolean') {
      return value ? 'Y' : 'N';
    }

    return value;
  };

  return (
    <TableRow>
      <TableCell>
        {row.locateAction ? locateButton : undefined}
      </TableCell>
      {visibleColumns.map((column) => (
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
      <TableCell padding="none">
        <Box display="flex" flexDirection="row">
          {row.updateAction ? editButton : undefined}
          {row.deleteAction ? deleteButton : undefined}
        </Box>
      </TableCell>
    </TableRow>
  );
}

DataTableRow.propTypes = {
  columns: COLUMNS_PROP_TYPES.isRequired,
  row: PropTypes.object.isRequired, // Row data with a shape specified in column settings
  selected: PropTypes.bool,
  getLocateIcon: PropTypes.func,
};

DataTableRow.defaultProps = {
  selected: false,
  getLocateIcon: undefined,
};

export default DataTableRow;
