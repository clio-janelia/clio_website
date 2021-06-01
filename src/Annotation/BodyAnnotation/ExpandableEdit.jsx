import React from 'react';
import PropTypes from 'prop-types';

function ExpandableEdit({
  initialValue,
  onValueChanged,
  onValueEntered,
}) {
  const handleEnterKey = (event) => {
    if (event.which === 13) {
      event.preventDefault();
      event.target.blur();
      if (onValueEntered) {
        onValueEntered(event.target.textContent);
      }
    }
  };

  return (
    <div
      contentEditable
      suppressContentEditableWarning
      onKeyDown={handleEnterKey}
      spellCheck={false}
      onBlur={
        (event) => {
          onValueChanged(event.target.textContent);
        }
      }
      style={
        {
          paddingLeft: '5px',
          paddingRight: '5px',
          maxWidth: '200px',
          display: 'inline-block',
          verticalAlign: 'top',
        }
      }
    >
      {`${(initialValue === null || initialValue === undefined) ? '' : initialValue}`}
    </div>
  );
}

ExpandableEdit.propTypes = {
  initialValue: PropTypes.string,
  onValueChanged: PropTypes.func.isRequired,
  onValueEntered: PropTypes.func,
};

ExpandableEdit.defaultProps = {
  initialValue: null,
  onValueEntered: null,
};

export default ExpandableEdit;
