import React from 'react';
import PropTypes from 'prop-types';
// import Input from '@material-ui/core/Input';
import Tooltip from '@material-ui/core/Tooltip';

export default function BodyColorControl({
  title,
  defaultColor,
  getBodies,
  setBodyColor,
}) {
  const handleColorChange = React.useCallback((event) => {
    // setColor(event.target.value);
    setBodyColor(getBodies(), event.target.value);
  }, [setBodyColor, getBodies]);

  return (
    <div>
      <Tooltip title={title}>
        <input
          style={{ width: '30px' }}
          type="color"
          defaultValue={defaultColor || '#ffffff'}
          onChange={handleColorChange}
          disableUnderline
        />
      </Tooltip>
    </div>
  );
}

BodyColorControl.propTypes = {
  defaultColor: PropTypes.string,
  title: PropTypes.string.isRequired,
  getBodies: PropTypes.func.isRequired,
  setBodyColor: PropTypes.func.isRequired,
};

BodyColorControl.defaultProps = {
  defaultColor: null,
};
