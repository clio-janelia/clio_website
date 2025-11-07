import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import DataTable from '../DataTable/DataTable';
import BodyAnnotationTableControl from './BodyAnnotationTableControl';
import BodyListControl from './BodyListControl';

// Generate storage key for dataset-specific field selections
const getStorageKey = (datasetName) => `clio_body_annotation_fields_${datasetName}`;

function BodyAnnotationTable({
  data,
  dataConfig,
  datasetName,
  showBodies,
  setBodyColor,
  localize,
}) {
  // Initialize columns from localStorage or default
  const getInitialColumns = () => {
    if (dataConfig.columns && dataConfig.columns.collection && datasetName) {
      try {
        const storageKey = getStorageKey(datasetName);
        const storedFields = localStorage.getItem(storageKey);

        if (storedFields) {
          // Parse stored fields
          const fieldsFromStorage = JSON.parse(storedFields);

          // Validate that the fields exist in the available columns collection
          const validFields = fieldsFromStorage.filter(
            (field) => dataConfig.columns.collection[field],
          );

          if (validFields.length > 0) {
            return {
              ...dataConfig.columns,
              shape: validFields,
            };
          }
        }
      } catch (error) {
        console.warn('Failed to load field selection from localStorage:', error);
      }
    }

    return dataConfig.columns;
  };

  const [columns, setColumns] = useState(getInitialColumns);

  // Save to localStorage when columns.shape changes
  useEffect(() => {
    if (columns && columns.shape && Array.isArray(columns.shape) && datasetName) {
      try {
        const storageKey = getStorageKey(datasetName);
        localStorage.setItem(storageKey, JSON.stringify(columns.shape));
      } catch (error) {
        console.warn('Failed to save field selection to localStorage:', error);
      }
    }
  }, [columns, datasetName]);

  // Wrapper for setColumns
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
  datasetName: PropTypes.string.isRequired,
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
