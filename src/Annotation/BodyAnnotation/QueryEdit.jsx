import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import FormGroup from '@material-ui/core/FormGroup';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import QueryMapEdit from './QueryMapEdit';

function QueryEdit({
  defaultQueryString, onQueryStringChanged, initialMode, queryStringify,
}) {
  const [queryString, setQueryString] = useState(defaultQueryString);
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    onQueryStringChanged(queryString);
  }, [queryString, onQueryStringChanged]);

  useEffect(() => {
    setQueryString(defaultQueryString);
  }, [defaultQueryString]);

  let widget = (
    <TextField
      label="Query"
      value={queryString}
      onChange={(event) => {
        setQueryString(event.target.value);
      }}
      multiline
      rows={3}
      variant="outlined"
      style={{ width: '100%' }}
    />
  );

  const handleQueryChangeFromMap = useCallback((query) => {
    if (query) {
      setQueryString(queryStringify(query));
    }
  }, [setQueryString, queryStringify]);

  if (mode === 'map') {
    let initialMap = null;
    try {
      initialMap = JSON.parse(queryString);
    } catch {
      initialMap = null;
    }
    widget = (
      <QueryMapEdit
        key={`QueryMapEdit.${queryStringify(initialMap)}`}
        initialMap={initialMap}
        onMapChanged={handleQueryChangeFromMap}
        style={{ width: '100%' }}
      />
    );
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
    <div style={{ width: '50%' }}>
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
