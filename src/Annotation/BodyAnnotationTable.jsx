import React, { useState } from 'react';
import PropTypes from 'prop-types';
import DataTable from './DataTable/DataTable';
import DataFieldControl from './DataTable/DataFieldControl';
import {
  getSortedFieldArray,
  sortColumns,
} from './DataTable/DataTableUtils';
// import { useLocalStorage } from '../utils/hooks';

function BodyAnnotationTable({ data, dataConfig }) {
  const [columns, setColumns] = useState(dataConfig.columns);

  const fieldSelection = dataConfig.columns.shape ? (
    <DataFieldControl
      fields={getSortedFieldArray(columns)}
      selectedFields={columns.shape}
      onChange={(value) => {
        setColumns(sortColumns({
          ...columns,
          shape: value,
        }));
      }}
    />
  ) : null;

  return (
    <DataTable
      data={{ rows: data }}
      config={{ ...dataConfig, columns }}
      getId={React.useCallback((row) => row.bodyid, [])}
      tableControls={fieldSelection}
    />
  );
}

BodyAnnotationTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  dataConfig: PropTypes.object.isRequired,
};

export default BodyAnnotationTable;
