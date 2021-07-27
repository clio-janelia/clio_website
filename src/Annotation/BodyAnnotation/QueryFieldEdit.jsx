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

  const append = useCallback(() => {
    onFieldChanged(initialField, field, value);
  }, [initialField, onFieldChanged, field, value]);

  const appendActive = useCallback((v) => {
    if (appending) {
      onFieldChanged(initialField, field, v);
    }
  }, [initialField, onFieldChanged, appending, field]);

  return (
    <div>
      {
        appending
          ? <span style={{ color: 'green', cursor: 'pointer' }} onClick={append} onKeyDown={() => {}}>+</span>
          : <span style={{ color: '#a04040', cursor: 'pointer' }} onClick={() => setField(null)} onKeyDown={() => {}}>−</span>
      }
      {'  '}
      <ExpandableEdit
        key={`${field || ''}_field`}
        role={appending ? 'active' : ''}
        initialValue={field}
        onValueChanged={(v) => setField(v)}
      />:
      <ExpandableEdit
        key={`${value || ''}_value`}
        role={appending ? 'active' : ''}
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
