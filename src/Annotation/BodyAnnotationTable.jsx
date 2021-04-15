import React from 'react';
import PropTypes from 'prop-types';
import DataTable from './DataTable/DataTable';

function BodyAnnotationTable({ data, dataConfig }) {
  return (
    <DataTable
      data={{ rows: data }}
      config={dataConfig}
      getId={React.useCallback((row) => row.bodyid, [])}
    />
  );
}

BodyAnnotationTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  dataConfig: PropTypes.object.isRequired,
};

export default BodyAnnotationTable;
