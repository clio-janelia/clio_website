import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ExpandableEdit from './ExpandableEdit';

function QueryFieldEdit({
  initialField, initialValue, onFieldChanged, appending,
}) {
  const [field, setField] = useState(initialField);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (!appending) {
      onFieldChanged(initialField, field, value);
    }
  }, [initialField, field, value, onFieldChanged, appending]);

  useEffect(() => {
    setField(initialField);
  }, [initialField]);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const append = useCallback(() => {
    onFieldChanged(initialField, field, value);
    setField(null);
    setValue(null);
  }, [initialField, onFieldChanged, field, value]);

  const appendActive = useCallback((v) => {
    if (appending) {
      onFieldChanged(initialField, field, v);
      setField(null);
      // FIXME: a hack solution for cleaning up the value
      setTimeout(() => setValue(null), 10);
    }
  }, [initialField, onFieldChanged, appending, field]);

  return (
    <div style={appending ? { color: 'gray' } : null}>
      {
        appending
          ? <span style={{ color: 'green', cursor: 'pointer' }} onClick={append} onKeyDown={() => {}}>+</span>
          : <span style={{ color: '#a04040', cursor: 'pointer' }} onClick={() => setField(null)} onKeyDown={() => {}}>−</span>
      }
      {'  '}
      <ExpandableEdit
        initialValue={field}
        onValueChanged={(v) => setField(v)}
      />:
      <ExpandableEdit
        initialValue={value}
        onValueChanged={(v) => setValue(v)}
        onValueEntered={(v) => appendActive(v)}
      />
    </div>
  );
}

QueryFieldEdit.propTypes = {
  initialField: PropTypes.string,
  initialValue: PropTypes.string,
  onFieldChanged: PropTypes.func.isRequired,
  appending: PropTypes.bool,
};

QueryFieldEdit.defaultProps = {
  initialField: null,
  initialValue: null,
  appending: false,
};

export default QueryFieldEdit;
