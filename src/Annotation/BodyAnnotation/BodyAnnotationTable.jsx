import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import DataTable from '../DataTable/DataTable';
import BodyAnnotationTableControl from './BodyAnnotationTableControl';
import BodyListControl from './BodyListControl';

function BodyAnnotationTable({
  data,
  dataConfig,
  showBodies,
  setBodyColor,
  localize,
}) {
  const history = useHistory();
  const location = useLocation();

  // Initialize columns from URL query parameter or default
  const getInitialColumns = () => {
    const searchParams = new URLSearchParams(location.search);
    const fieldsParam = searchParams.get('fields');

    if (fieldsParam && dataConfig.columns && dataConfig.columns.collection) {
      // Parse comma-separated fields from URL
      const fieldsFromUrl = fieldsParam.split(',').filter((f) => f.trim());

      // Validate that the fields exist in the available columns collection
      const validFields = fieldsFromUrl.filter((field) => dataConfig.columns.collection[field]);

      if (validFields.length > 0) {
        return {
          ...dataConfig.columns,
          shape: validFields,
        };
      }
    }

    return dataConfig.columns;
  };

  const [columns, setColumns] = useState(getInitialColumns);

  // Update URL when columns.shape changes
  useEffect(() => {
    if (columns && columns.shape && Array.isArray(columns.shape)) {
      const searchParams = new URLSearchParams(location.search);
      const currentFields = searchParams.get('fields');
      const newFields = columns.shape.join(',');

      if (currentFields !== newFields) {
        searchParams.set('fields', newFields);
        const newUrl = `${location.pathname}?${searchParams.toString()}`;
        history.replace(newUrl);
      }
    }
  }, [columns, location.pathname, location.search, history]);

  // Wrapper for setColumns that updates both state and URL
  const handleSetColumns = useCallback((newColumns) => {
    setColumns(newColumns);
  }, []);

  const makeTableControl = React.useCallback(
    (rows) => (
      <BodyAnnotationTableControl
        rows={rows}
        columns={columns}
        showBodies={showBodies}
        setBodyColor={setBodyColor}
        setColumns={handleSetColumns}
      />
    ),
    [columns, showBodies, setBodyColor, handleSetColumns],
  );

  const makeCheckedSetControl = React.useCallback(
    (checkedSet) => (
      <BodyListControl
        sourceString="checked bodies"
        getBodies={() => (checkedSet ? [...checkedSet] : [])}
        setBodyColor={setBodyColor}
        highlightBodies={showBodies}
      />
    ),
    [showBodies, setBodyColor],
  );

  return (
    <DataTable
      data={{ rows: data }}
      config={{ ...dataConfig, columns }}
      getId={React.useCallback((row) => row.bodyid, [])}
      makeTableControl={makeTableControl}
      makeCheckedSetControl={makeCheckedSetControl}
      localize={localize}
    />
  );
}

BodyAnnotationTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  dataConfig: PropTypes.object.isRequired,
  showBodies: PropTypes.func,
  setBodyColor: PropTypes.func,
  localize: PropTypes.func,
};

BodyAnnotationTable.defaultProps = {
  showBodies: null,
  setBodyColor: null,
  localize: null,
};

export default BodyAnnotationTable;
