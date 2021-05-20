import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import QueryFieldEdit from './QueryFieldEdit';

function FieldEditList({ inputMap, handleFieldChange }) {
  if (typeof inputMap === 'string') {
    return null;
  }

  return inputMap && Object.keys(inputMap).map((key) => {
    let value = inputMap[key];
    if (Array.isArray(inputMap[key])) {
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

function QueryMapEdit({ initialMap, forceUpdate, onMapChanged }) {
  const [inputMap, setInputMap] = useState(initialMap);

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
        newMap[field] = value;
      }
      return newMap;
    });
  }, [setInputMap]);

  useEffect(() => {
    onMapChanged(inputMap);
  }, [inputMap, onMapChanged]);

  useEffect(() => {
    if (forceUpdate) {
      setInputMap(initialMap);
    }
  }, [initialMap, forceUpdate]);

  return (
    <div>
      <FieldEditList inputMap={inputMap} handleFieldChange={handleFieldChange} />
      <QueryFieldEdit
        initialField={null}
        initialValue={null}
        onFieldChanged={handleFieldChange}
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
  forceUpdate: PropTypes.bool,
  onMapChanged: PropTypes.func.isRequired,
};

QueryMapEdit.defaultProps = {
  initialMap: null,
  forceUpdate: false,
};

export default QueryMapEdit;
