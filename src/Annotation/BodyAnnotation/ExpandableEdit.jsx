import React from 'react';
import PropTypes from 'prop-types';

function ExpandableEdit({
  initialValue,
  onValueChanged,
}) {
  const handleEnterKey = (event) => {
    if (event.which === 13) {
      event.preventDefault();
      event.target.blur();
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
};

ExpandableEdit.defaultProps = {
  initialValue: null,
};

export default ExpandableEdit;
