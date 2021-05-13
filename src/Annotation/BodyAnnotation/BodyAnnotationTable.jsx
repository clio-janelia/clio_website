import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import DataTable from './DataTable/DataTable';
import DataFieldControl from './DataTable/DataFieldControl';
import {
  getSortedFieldArray,
  sortColumns,
  useStyles,
} from './DataTable/DataTableUtils';
// import { useLocalStorage } from '../utils/hooks';

function BodyAnnotationTable({ data, dataConfig, showBodies }) {
  const [columns, setColumns] = useState(dataConfig.columns);
  const classes = useStyles();

  const makeTableControl = React.useCallback(({ filteredRows }) => {
    const fieldControl = columns.shape ? (
      <DataFieldControl
        fields={getSortedFieldArray(columns)}
        selectedFields={columns.shape}
        onChange={(value) => {
          setColumns(sortColumns({
            ...columns,
            shape: value,
          }));
        }}
        fieldHint
      />
    ) : null;

    const showBodyButton = showBodies ? (
      <Button
        color="primary"
        variant="contained"
        onClick={
          () => showBodies(filteredRows.map((row) => row.bodyid))
        }
      >
        View Bodies
      </Button>
    ) : null;

    if (!fieldControl && !showBodyButton) {
      return null;
    }

    return (
      <div className={classes.controlRow}>
        {fieldControl}
        {showBodyButton}
      </div>
    );
  }, [columns, classes, showBodies]);

  return (
    <DataTable
      data={{ rows: data }}
      config={{ ...dataConfig, columns }}
      getId={React.useCallback((row) => row.bodyid, [])}
      makeTableControl={makeTableControl}
    />
  );
}

BodyAnnotationTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  dataConfig: PropTypes.object.isRequired,
  showBodies: PropTypes.func,
};

BodyAnnotationTable.defaultProps = {
  showBodies: null,
};

export default BodyAnnotationTable;
