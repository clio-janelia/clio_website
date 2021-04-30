import React from 'react';

import PropTypes from 'prop-types';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TextField from '@material-ui/core/TextField';
import {
  getVisibleColumns,
  useStyles,
} from './DataTableUtils';

export default function DataTableHead({
  columns, makeRow, handleFilterChange,
}) {
  const classes = useStyles();
  const handleFilterKeyUp = (event, column) => {
    handleFilterChange(column, event.target.value);
  };

  const visibleColumns = getVisibleColumns(columns);

  const filterRow = visibleColumns.map((column) => (
    <TableCell key={column.field}>
      <TextField
        label={column.title}
        onKeyUp={(event) => handleFilterKeyUp(event, column.field)}
        disabled={!column.filterEnabled}
        style={{
          whiteSpace: 'nowrap',
        }}
        InputProps={{
          style: { width: `${column.title.length * 8}px` },
        }}
      />
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
};

DataTableHead.defaultProps = {
  makeRow: null,
};
