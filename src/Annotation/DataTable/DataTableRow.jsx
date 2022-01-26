import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/DeleteOutlined';
import EditIcon from '@material-ui/icons/EditOutlined';
import LocateIcon from '@material-ui/icons/RoomOutlined';
import LocateIconSelected from '@material-ui/icons/Room';
import Tooltip from '@material-ui/core/Tooltip';
import Checkbox from '@material-ui/core/Checkbox';
import DataEdit from './DataEdit';
import DataCell from './DataCell';
import {
  getVisibleColumns,
  getColumnSetting,
  getColumnFields,
  COLUMNS_PROP_TYPES,
  useStyles,
} from './DataTableUtils';

function DataTableRow(props) {
  const classes = useStyles();
  const {
    columns, row, selected, getLocateIcon, localize, rowChecked, onRowChecked,
  } = props;

  const allColumnFields = getColumnFields(columns);
  const isValid = allColumnFields.every((field) => {
    const column = getColumnSetting(columns, field);
    if (column.validate) {
      return column.validate(row[column.field]);
    }
    return true;
  });

  const isValidAfterChange = (change) => allColumnFields.every((field) => {
    const column = getColumnSetting(columns, field);
    if (column.validate) {
      let value = row[column.field];
      if (column.field in change) {
        value = change[column.field];
      }
      return column.validate(value);
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
      className={classes.tableRowIcon}
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

  let checkWidget;
  if (onRowChecked) {
    checkWidget = (
      <Checkbox
        className={classes.tableRowIcon}
        checked={rowChecked || false}
        onChange={
          (event) => onRowChecked(event.target.checked)
        }
      />
    );
  }

  const makeToolColumn = useCallback((children) => (
    <TableCell padding="none" key="#toolColumn" className={classes.toolColumn}>
      <Box display="flex" flexDirection="row">
        {checkWidget}
        {locateButton}
        {children}
      </Box>
    </TableCell>
  ), [classes, checkWidget, locateButton]);

  if (editing) {
    return (
      <DataEdit
        key="DataEdit"
        config={{
          columns: [
            {
              field: '#toolColumn',
              makeCell: makeToolColumn,
            },
            ...visibleColumns,
          ],
          // validitingColumns: columns.collection,
        }}
        defaultData={row}
        onCancelEdit={cancelEdit}
        onConfirmChange={takeChange}
      />
    );
  }

  const editButton = (
    <Tooltip enterDelay={500} title="Edit">
      <IconButton className={classes.tableRowIcon} onClick={handleEditClicked}>
        <EditIcon />
      </IconButton>
    </Tooltip>
  );

  const deleteButton = (
    <Tooltip enterDelay={500} title="Delete">
      <IconButton className={classes.tableRowIcon} onClick={row.deleteAction}>
        <DeleteIcon />
      </IconButton>
    </Tooltip>
  );

  return (
    <TableRow>
      <TableCell
        padding="none"
        className={classes.toolColumn}
      >
        <Box display="flex" flexDirection="row">
          {checkWidget}
          {row.locateAction ? locateButton : undefined}
          {row.updateAction ? editButton : undefined}
          {row.deleteAction ? deleteButton : undefined}
        </Box>
      </TableCell>
      {visibleColumns.map((column) => (
        <TableCell
          key={column.field}
          align={column.align}
          component="th"
          scope="row"
          style={column.style}
        >
          <DataCell
            column={column}
            value={row[column.field]}
            onErrorClick={handleEditClicked}
            localize={localize}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}

DataTableRow.propTypes = {
  columns: COLUMNS_PROP_TYPES.isRequired,
  row: PropTypes.object.isRequired, // Row data with a shape specified in column settings
  selected: PropTypes.bool,
  getLocateIcon: PropTypes.func,
  localize: PropTypes.func,
  rowChecked: PropTypes.bool,
  onRowChecked: PropTypes.func,
};

DataTableRow.defaultProps = {
  selected: false,
  getLocateIcon: undefined,
  localize: undefined,
  rowChecked: false,
  onRowChecked: undefined,
};

export default DataTableRow;
