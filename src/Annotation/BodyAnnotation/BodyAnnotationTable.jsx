import React, { useState } from 'react';
import PropTypes from 'prop-types';
import DataTable from '../DataTable/DataTable';
import BodyAnnotationTableControl from './BodyAnnotationTableControl';
import BodyListControl from './BodyListControl';

function BodyAnnotationTable({
  data, dataConfig, showBodies, setBodyColor,
}) {
  const [columns, setColumns] = useState(dataConfig.columns);

  const makeTableControl = React.useCallback((rows) => (
    <BodyAnnotationTableControl
      rows={rows}
      columns={columns}
      showBodies={showBodies}
      setBodyColor={setBodyColor}
      setColumns={setColumns}
    />
  ), [columns, showBodies, setBodyColor]);

  const makeCheckedSetControl = React.useCallback((checkedSet) => (
    <BodyListControl
      sourceString="checked bodies"
      getBodies={() => (checkedSet ? [...checkedSet] : [])}
      setBodyColor={setBodyColor}
      highlightBodies={showBodies}
    />
  ), [showBodies, setBodyColor]);

  return (
    <DataTable
      data={{ rows: data }}
      config={{ ...dataConfig, columns }}
      getId={React.useCallback((row) => row.bodyid, [])}
      makeTableControl={makeTableControl}
      makeCheckedSetControl={makeCheckedSetControl}
    />
  );
}

BodyAnnotationTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  dataConfig: PropTypes.object.isRequired,
  showBodies: PropTypes.func,
  setBodyColor: PropTypes.func,
};

BodyAnnotationTable.defaultProps = {
  showBodies: null,
  setBodyColor: null,
};

export default BodyAnnotationTable;
