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

  const { data, selectedId, getId } = props;

  useEffect(() => {
    if (selectedId) {
      for (let i = 0; i < data.rows.length; i += 1) {
        if (data.rows[i].id === selectedId) {
          setPage(Math.floor(i / rowsPerPage));
          break;
        }
      }
    }
  }, [selectedId, setPage, data.rows, rowsPerPage]);

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
                  key={getId(row)}
                  config={config}
                  row={row}
                  selected={getId(row) === selectedId}
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
  data: PropTypes.shape({
    rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  config: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.shape({
      field: PropTypes.string,
      title: PropTypes.string,
      filterEnabled: PropTypes.bool,
    })),
  }).isRequired,
  getId: PropTypes.func.isRequired, // Get id for row
  selectedId: PropTypes.string, // Selected ID
};

DataTable.defaultProps = {
  selectedId: null,
};
