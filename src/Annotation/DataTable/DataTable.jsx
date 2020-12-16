import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import TableContainer from '@material-ui/core/TableContainer';
import TablePagination from '@material-ui/core/TablePagination';

import DataTableHead from './DataTableHead';
import DataTableRow from './DataTableRow';

const useStyles = makeStyles({
  root: {
    width: '100%',
    backgroundColor: 'white',
  },
  container: {
    maxHeight: 440,
  },
});

export default function DataTable(props) {
  const classes = useStyles();
  const rowsPerPageOptions = [5, 10, 20, { label: 'All', value: -1 }];

  const [filter, setFilter] = useState();
  const [filteredRows, setFilteredRows] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);

  const { data, selectedId } = props;

  useEffect(() => {
    if (filter) {
      setFilteredRows(
        data.rows.filter(
          (row) => Object.keys(filter).every(
            (key) => (!filter[key]) || row[key].includes(filter[key]),
          ),
        ),
      );
    } else {
      setFilteredRows(data.rows);
    }
  }, [filter, data.rows]);

  const handleFilterChange = (column, columnFilter) => {
    const newFilter = { ...filter };
    newFilter[column] = columnFilter;
    setFilter(newFilter);
  };

  const rowHeight = 38;
  const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredRows.length - page * rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const { config } = props;

  return (
    <div className={classes.root}>
      <TableContainer className={classes.container}>
        <Table stickyHeader className={classes.table} size="small" aria-label="simple table">
          <DataTableHead config={config} handleFilterChange={handleFilterChange} />
          <TableBody>
            {filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(
              (row) => (
                <DataTableRow
                  key={props.getKey(row)}
                  config={config}
                  row={row}
                  selected={row.id === selectedId}
                />
              ),
            )}
            {emptyRows > 0 && (
              <TableRow style={{ height: rowHeight * emptyRows }}>
                <TableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        colSpan={3}
        count={filteredRows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        SelectProps={{
          inputProps: { 'aria-label': 'rows per page' },
          native: true,
        }}
        onChangePage={handleChangePage}
        onChangeRowsPerPage={handleChangeRowsPerPage}
        component="div"
      />
    </div>
  );
}

DataTable.propTypes = {
  data: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  getKey: PropTypes.func.isRequired,
  selectedId: PropTypes.string,
};

DataTable.defaultProps = {
  selectedId: null,
};
