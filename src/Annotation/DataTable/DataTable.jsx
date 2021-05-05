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
import {
  COLUMNS_PROP_TYPES,
} from './DataTableUtils';

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  if (orderBy) {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }
  return null;
}

function stableSort(array, comparator) {
  if (comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  }

  return array;
}

const useStyles = makeStyles({
  dataTableRoot: {
    width: '100%',
    backgroundColor: 'white',
  },
  container: {
    maxHeight: 440,
  },
});

export default function DataTable({
  data, config, selectedId, getId, getLocateIcon, makeHeaderRow, tableControls,
}) {
  const classes = useStyles();
  const rowsPerPageOptions = [5, 10, 20, { label: 'All', value: -1 }];

  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState(null);
  const [filter, setFilter] = useState();
  const [filteredRows, setFilteredRows] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);

  const handleRequestSort = (event, field) => {
    setOrder((orderBy === field && order === 'asc') ? 'desc' : 'asc');
    setOrderBy(field);
  };

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
    let newRows = data.rows;
    if (filter) {
      newRows = data.rows.filter(
        (row) => Object.keys(filter).every(
          (key) => {
            if (filter[key]) {
              let rowValue = row[key];
              const filterString = filter[key].toLowerCase();
              if (typeof rowValue === 'boolean') {
                return rowValue ? (filterString === 'y') : (filterString === 'n');
              }
              if (typeof rowValue === 'number') {
                rowValue = rowValue.toString();
              }
              return (rowValue && rowValue.toLowerCase().includes(filterString));
            }
            return true;
          },
        ),
      );
    }
    newRows = stableSort(newRows, getComparator(order, orderBy));
    setFilteredRows(newRows);
  }, [filter, data.rows, order, orderBy]);

  const handleFilterChange = (column, columnFilter) => {
    setFilter((prevFilter) => {
      if (columnFilter) {
        return { ...prevFilter, [column]: columnFilter };
      }

      let newFilter = { ...prevFilter };
      delete newFilter[column];
      if (Object.keys(newFilter).length === 0) {
        newFilter = null;
      }

      return newFilter;
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(Math.min(newPage, maxPage));
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
  };

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
            columns={config.columns}
            handleFilterChange={handleFilterChange}
            makeRow={makeHeaderRow ? (headers) => makeHeaderRow(headers, filteredRows) : null}
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
          />
          <TableBody>
            {(rowsPerPage > 0 ? filteredRows.slice(
              actualPage * rowsPerPage,
              actualPage * rowsPerPage + rowsPerPage,
            ) : filteredRows).map(
              (row) => (
                <DataTableRow
                  key={getId(row)}
                  columns={config.columns}
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
    columns: COLUMNS_PROP_TYPES.isRequired,
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
