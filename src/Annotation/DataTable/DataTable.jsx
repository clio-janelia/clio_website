import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import ClearIcon from '@material-ui/icons/HighlightOffTwoTone';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import TableContainer from '@material-ui/core/TableContainer';
import TablePagination from '@material-ui/core/TablePagination';
import DataTableHead from './DataTableHead';
import DataTableRow from './DataTableRow';
import {
  useStyles,
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

function CheckedSetControl({ checkedSet, uncheckAll, makeCheckedSetControl }) {
  if (checkedSet.size) {
    return (
      <div>
        {`☑ ⨉ ${checkedSet.size}`}
        <Tooltip title="Uncheck all">
          <IconButton onClick={uncheckAll}><ClearIcon /></IconButton>
        </Tooltip>
        {makeCheckedSetControl ? makeCheckedSetControl(checkedSet) : null}
      </div>
    );
  }

  return null;
}

CheckedSetControl.propTypes = {
  checkedSet: PropTypes.object.isRequired,
  uncheckAll: PropTypes.func.isRequired,
  makeCheckedSetControl: PropTypes.func,
};

CheckedSetControl.defaultProps = {
  makeCheckedSetControl: null,
};

export default function DataTable({
  data,
  config,
  selectedId,
  getId,
  getLocateIcon,
  makeHeaderRow,
  makeTableControl,
  makeCheckedSetControl,
}) {
  const classes = useStyles();
  const rowsPerPageOptions = [5, 10, 20];

  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState(null);
  const [filter, setFilter] = useState();
  const [filteredRows, setFilteredRows] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);
  const [checkedSet, setCheckedSet] = useState(new Set());

  const handleRequestSort = (event, field) => {
    setOrder((orderBy === field && order === 'asc') ? 'desc' : 'asc');
    setOrderBy(field);
  };

  const uncheckAll = React.useCallback(() => {
    setCheckedSet(new Set());
  }, []);

  const rowHeight = 44;
  const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredRows.length - page * rowsPerPage);
  const maxPage = Math.max(0, Math.floor((filteredRows.length - 1) / rowsPerPage));

  useEffect(() => {
    setCheckedSet((prevCheckedSet) => new Set(
      [...prevCheckedSet].filter(
        (id) => data.rows.find((row) => getId(row) === id),
      ),
    ));
  }, [data.rows, getId]);

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
              if (Array.isArray(rowValue)) {
                rowValue = rowValue.join(', ');
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
      rowsPerPageOptions={[...rowsPerPageOptions, filteredRows.length > 100 ? 100 : { label: 'All', value: -1 }]}
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

  const getTableRow = (row) => {
    const rowId = getId(row);

    return (
      <DataTableRow
        key={rowId}
        columns={config.columns}
        row={row}
        selected={rowId === selectedId}
        getLocateIcon={getLocateIcon}
        rowChecked={checkedSet.has(rowId)}
        onRowChecked={(checked) => {
          setCheckedSet((prevCheckedSet) => {
            const newCheckedSet = new Set(prevCheckedSet);
            if (checked) {
              newCheckedSet.add(rowId);
            } else {
              newCheckedSet.delete(rowId);
            }
            return newCheckedSet;
          });
        }}
      />
    );
  };

  return (
    <div className={classes.dataTableRoot}>
      {makeTableControl ? makeTableControl(filteredRows, checkedSet) : null}
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
              (row) => getTableRow(row),
            )}
            {emptyRows > 0 && (
              <TableRow style={{ height: rowHeight * emptyRows }}>
                <TableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <div className={classes.controlRow}>
        <CheckedSetControl
          checkedSet={checkedSet}
          uncheckAll={uncheckAll}
          makeCheckedSetControl={makeCheckedSetControl}
        />
        <div style={{ marginLeft: 'auto' }}>{pagination}</div>
      </div>
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
  makeTableControl: PropTypes.func,
  makeCheckedSetControl: PropTypes.func,
};

DataTable.defaultProps = {
  selectedId: null,
  getLocateIcon: null,
  makeHeaderRow: null,
  makeTableControl: null,
  makeCheckedSetControl: null,
};
