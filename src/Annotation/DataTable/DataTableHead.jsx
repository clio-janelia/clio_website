import React from 'react';

import PropTypes from 'prop-types';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TextField from '@material-ui/core/TextField';

export default function DataTableHead(props) {
  const handleFilterKeyUp = (event, column) => {
    props.handleFilterChange(column, event.target.value);
  };

  const { config, makeRow } = props;

  const filterRow = config.columns.map((column) => (
    <TableCell key={column.field}>
      <TextField
        label={column.title}
        onKeyUp={(event) => handleFilterKeyUp(event, column.field)}
        disabled={!column.filterEnabled}
      />
    </TableCell>
  ));

  let headers = null;
  if (makeRow) {
    headers = makeRow(filterRow);
  } else {
    headers = (
      <TableRow>
        <TableCell />
        {filterRow}
        <TableCell />
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
  config: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.shape({
      field: PropTypes.string,
      title: PropTypes.string,
      filterEnabled: PropTypes.bool,
    })),
  }).isRequired,
  handleFilterChange: PropTypes.func.isRequired, // Function of filtering a given column
  makeRow: PropTypes.func,
};

DataTableHead.defaultProps = {
  makeRow: null,
};
