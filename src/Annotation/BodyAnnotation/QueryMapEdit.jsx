import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Paper } from '@material-ui/core';
import QueryFieldEdit from './QueryFieldEdit';

function FieldEditList({ inputMap, handleFieldChange }) {
  if (!inputMap || typeof inputMap === 'string' || Object.keys(inputMap).length === 0) {
    return <Paper variant="outlined" style={{ color: 'gray' }}>No query specified</Paper>;
  }

  return inputMap && Object.keys(inputMap).map((key) => {
    let value = inputMap[key];
    if (typeof value === 'string') {
      try {
        // Quote parsible string to keep string type
        JSON.parse(value);
        value = `'${value}'`;
      /* eslint-disable-next-line no-empty */
      } catch (e) {
      }
    } else {
      value = JSON.stringify(value);
    }
    return (
      <QueryFieldEdit
        key={key}
        initialField={key}
        initialValue={value}
        onFieldChanged={handleFieldChange}
      />
    );
  });
}

function QueryMapEdit({ initialMap, onMapChanged }) {
  const [inputMap, setInputMap] = useState(initialMap || {});
  const [activeEntryGen, setActiveEntryGen] = useState(1); // For clearing up the active entry

  const handleFieldChange = useCallback((key, field, value) => {
    setInputMap((prevMap) => {
      let newMap = {};
      if (prevMap && typeof prevMap !== 'string') {
        newMap = { ...prevMap };
      }
      if (key !== field) {
        delete newMap[key];
      }
      if (field) {
        let newValue = value;

        try {
          const re = /^\s*'(.*)'\s*$/;
          const m = re.exec(value);
          if (m) {
            [, newValue] = m;
          } else {
            newValue = JSON.parse(value);
          }
        /* eslint-disable-next-line no-empty */
        } catch (e) {
        } finally {
          newMap[field] = newValue;
        }
      }
      return newMap;
    });
  }, [setInputMap]);

  const appendField = useCallback((key, field, value) => {
    handleFieldChange(key, field, value);
    setActiveEntryGen((prevGen) => prevGen + 1);
  }, [handleFieldChange]);

  useEffect(() => {
    onMapChanged(inputMap);
  }, [inputMap, onMapChanged]);

  return (
    <div>
      <Paper variant="outlined">
        <FieldEditList inputMap={inputMap} handleFieldChange={handleFieldChange} />
      </Paper>
      <QueryFieldEdit
        key={`active_entry_${activeEntryGen}`}
        onFieldChanged={appendField}
        appending
      />
    </div>
  );
}

QueryMapEdit.propTypes = {
  initialMap: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
  ]),
  onMapChanged: PropTypes.func.isRequired,
};

QueryMapEdit.defaultProps = {
  initialMap: {},
};

export default QueryMapEdit;
