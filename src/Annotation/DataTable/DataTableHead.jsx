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

  const { config } = props;
  const filterRow = config.columns.map((column) => (
    <TableCell key={column.field}>
      <TextField
        label={column.title}
        onKeyUp={(event) => handleFilterKeyUp(event, column.field)}
        disabled={!column.filterEnabled}
      />
    </TableCell>
  ));

  return (
    <TableHead>
      <TableRow>
        <TableCell />
        {filterRow}
      </TableRow>
    </TableHead>
  );
}

DataTableHead.propTypes = {
  config: PropTypes.object.isRequired,
  handleFilterChange: PropTypes.func.isRequired,
};
