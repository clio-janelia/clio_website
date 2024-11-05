import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import FormGroup from '@material-ui/core/FormGroup';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import ListEdit from '../../components/ListEdit';
import QueryMapEdit from './QueryMapEdit';

function QueryEdit({
  defaultQueryString, onQueryStringChanged, initialMode, queryStringify,
}) {
  const [queryString, setQueryString] = useState(defaultQueryString);
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    onQueryStringChanged(queryString);
  }, [queryString, onQueryStringChanged]);

  let widget = (
    <TextareaAutosize
      label="Query"
      value={queryString}
      onChange={(event) => {
        setQueryString(event.target.value);
      }}
      rowsMin={3}
      spellCheck="false"
      placeholder='Enter JSON query here. eg. {"status": ["Anchor", "Prelim Roughly traced", "Roughly traced"]}'
      style={{ width: '100%' }}
    />
  );

  const handleQueryChangeFromMap = useCallback((query) => {
    if (query) {
      setQueryString(queryStringify(query));
    }
  }, [setQueryString, queryStringify]);

  const handleEditValueChange = useCallback((value) => {
    if (value) {
      setQueryString(value.length > 1 ? `[\n${value.map((item) => (item || '{}')).join(',\n')}\n]` : value[0]);
      // setQueryString(queryStringify(value));
    }
  }, [setQueryString]);

  const renderElement = React.useCallback((element, handleValueChange) => (
    <QueryMapEdit
      key={`QueryMapEdit.${element || ''}`}
      initialMap={element ? JSON.parse(element) : {}}
      onMapChanged={(obj) => handleValueChange(queryStringify(obj))}
      style={{ width: '100%' }}
    />
  ), [queryStringify]);

  if (mode === 'map') {
    let queryObject = null;
    try {
      queryObject = JSON.parse(queryString);
    } catch {
      queryObject = null;
    }
    if (queryObject) {
      if (!Array.isArray(queryObject)) {
        queryObject = [queryObject];
      }
      queryObject = queryObject.map((obj) => queryStringify(obj));
      widget = (
        <ListEdit
          key={`QueryMapEdit.${queryStringify(queryObject)}`}
          defaultValue={queryObject}
          onValueChange={handleEditValueChange}
          renderElement={renderElement}
        />
      );
    } else {
      widget = (
        <QueryMapEdit
          key={`QueryMapEdit.${queryStringify(queryObject)}`}
          initialMap={queryObject}
          onMapChanged={handleQueryChangeFromMap}
          style={{ width: '100%' }}
        />
      );
    }
  }

  const handleEditModeChange = (event) => {
    setMode(event.target.value);
  };

  const control = (
    <FormControl component="fieldset">
      <FormGroup row>
        <RadioGroup row value={mode} onChange={handleEditModeChange}>
          <FormControlLabel value="text" control={<Radio color="primary" />} label="🔍plain" />
          <FormControlLabel value="map" control={<Radio color="primary" />} label="🔍structured" />
        </RadioGroup>
      </FormGroup>
    </FormControl>
  );

  return (
    <div style={{ width: '80%' }}>
      {control}
      <br />
      {widget}
    </div>
  );
}

QueryEdit.propTypes = {
  defaultQueryString: PropTypes.string.isRequired,
  onQueryStringChanged: PropTypes.func.isRequired,
  initialMode: PropTypes.string,
  queryStringify: PropTypes.func.isRequired,
};

QueryEdit.defaultProps = {
  initialMode: 'text',
};

export default QueryEdit;
