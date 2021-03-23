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
  dataTableRoot: {
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

  const {
    data, selectedId, getId, getLocateIcon, makeHeaderRow, tableControls,
  } = props;

  const rowHeight = 44;
  const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredRows.length - page * rowsPerPage);
  const maxPage = Math.max(0, Math.floor((filteredRows.length - 1) / rowsPerPage));

  useEffect(() => {
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [page, maxPage]);

  useEffect(() => {
    if (selectedId) {
      for (let i = 0; i < filteredRows.length; i += 1) {
        if (filteredRows[i].id === selectedId) {
          setPage(Math.floor(i / rowsPerPage));
          break;
        }
      }
    }
  }, [selectedId, setPage, filteredRows, rowsPerPage]);

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
    setFilter((prevFilter) => ({ ...prevFilter, [column]: columnFilter }));
  };

  const handleChangePage = (event, newPage) => {
    setPage(Math.min(newPage, maxPage));
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const { config } = props;

  const actualPage = Math.min(page, maxPage);

  const pagination = (
    <TablePagination
      rowsPerPageOptions={rowsPerPageOptions}
      colSpan={3}
      count={filteredRows.length}
      rowsPerPage={rowsPerPage}
      page={actualPage}
      SelectProps={{
        inputProps: { 'aria-label': 'rows per page' },
        native: true,
      }}
      onChangePage={handleChangePage}
      onChangeRowsPerPage={handleChangeRowsPerPage}
      component="div"
    />
  );

  return (
    <div className={classes.dataTableRoot}>
      {tableControls}
      <TableContainer className={classes.container}>
        <Table stickyHeader className={classes.table} size="small" aria-label="simple table">
          <DataTableHead
            config={config}
            handleFilterChange={handleFilterChange}
            makeRow={makeHeaderRow}
          />
          <TableBody>
            {(rowsPerPage > 0 ? filteredRows.slice(
              actualPage * rowsPerPage,
              actualPage * rowsPerPage + rowsPerPage,
            ) : filteredRows).map(
              (row) => (
                <DataTableRow
                  key={getId(row)}
                  config={config}
                  row={row}
                  selected={getId(row) === selectedId}
                  getLocateIcon={getLocateIcon}
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
      {pagination}
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
  getLocateIcon: PropTypes.func,
  makeHeaderRow: PropTypes.func,
  tableControls: PropTypes.object,
};

DataTable.defaultProps = {
  selectedId: null,
  getLocateIcon: null,
  makeHeaderRow: null,
  tableControls: null,
};
