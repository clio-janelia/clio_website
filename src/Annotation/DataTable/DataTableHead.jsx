import React from 'react';

import PropTypes from 'prop-types';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TextField from '@material-ui/core/TextField';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import {
  getVisibleColumns,
  useStyles,
} from './DataTableUtils';

export default function DataTableHead({
  columns, makeRow, handleFilterChange, order, orderBy, onRequestSort,
}) {
  const classes = useStyles();
  const createSortHandler = (field) => (event) => {
    onRequestSort(event, field);
  };
  const createFilterHandler = (field) => (event) => {
    handleFilterChange(field, event.target.value);
  };

  const visibleColumns = getVisibleColumns(columns);

  const filterRow = visibleColumns.map((column) => (
    <TableCell
      key={column.field}
      sortDirection={orderBy === column.field ? order : false}
    >
      <div className={classes.controlRow}>
        <TextField
          label={column.title}
          onKeyUp={createFilterHandler(column.field)}
          disabled={!column.filterEnabled}
          style={{
            whiteSpace: 'nowrap',
          }}
          InputProps={{
            style: { width: `${(column.textLengthHint || column.title.length) * 7}px` },
          }}
        />
        <TableSortLabel
          active={orderBy === column.field}
          direction={(orderBy === column.field) ? order : 'asc'}
          onClick={createSortHandler(column.field)}
        >
          <font style={{ color: 'lightgray' }}>●</font>
        </TableSortLabel>
      </div>
    </TableCell>
  ));

  let headers = null;
  if (makeRow) {
    headers = makeRow(filterRow);
  } else {
    headers = (
      <TableRow>
        <TableCell className={classes.toolColumn} />
        {filterRow}
      </TableRow>
    );
  }

  return (
    <TableHead>
      {headers}
    </TableHead>
  );
}

DataTableHead.propTypes = {
  columns: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.shape({
      field: PropTypes.string,
      title: PropTypes.string,
      filterEnabled: PropTypes.bool,
    })),
    PropTypes.shape({
      shape: PropTypes.arrayOf(PropTypes.string),
      collection: PropTypes.object,
    }),
  ]).isRequired,
  handleFilterChange: PropTypes.func.isRequired, // Function of filtering a given column
  makeRow: PropTypes.func,
  order: PropTypes.string,
  orderBy: PropTypes.string,
  onRequestSort: PropTypes.func.isRequired,
};

DataTableHead.defaultProps = {
  makeRow: null,
  order: false,
  orderBy: null,
};
