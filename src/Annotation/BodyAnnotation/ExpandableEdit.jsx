import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

function ExpandableEdit({
  initialValue,
  resetAfterValueChange,
  role,
  onValueChanged,
  onValueEntered,
}) {
  const [value, setValue] = React.useState(initialValue);

  const handleEnterKey = (event) => {
    if (event.which === 13) {
      event.preventDefault();
      event.target.blur();
      if (onValueEntered) {
        onValueEntered(event.target.textContent);
      }
    }
  };

  useEffect(() => {
    if (resetAfterValueChange && value !== initialValue) {
      setValue(initialValue);
    }
  }, [resetAfterValueChange, initialValue, value]);

  const style = {
    paddingLeft: '5px',
    paddingRight: '5px',
    marginTop: '2px',
    marginBottom: '2px',
    maxWidth: '200px',
    display: 'inline-block',
    verticalAlign: 'top',
  };

  if (role === 'active') {
    style.color = '#808080';
  }

  if (!initialValue) {
    style.backgroundColor = '#E5E5E5';
  }

  return (
    <div
      contentEditable
      suppressContentEditableWarning
      onKeyDown={handleEnterKey}
      spellCheck={false}
      onBlur={
        (event) => {
          onValueChanged(event.target.textContent);
          setValue(event.target.textContent);
        }
      }
      style={style}
    >
      {`${value || ''}`}
    </div>
  );
}

ExpandableEdit.propTypes = {
  initialValue: PropTypes.string,
  onValueChanged: PropTypes.func.isRequired,
  onValueEntered: PropTypes.func,
  resetAfterValueChange: PropTypes.bool,
  role: PropTypes.string,
};

ExpandableEdit.defaultProps = {
  initialValue: null,
  onValueEntered: null,
  resetAfterValueChange: false,
  role: '',
};

export default ExpandableEdit;
