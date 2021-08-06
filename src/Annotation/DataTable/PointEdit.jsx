import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import IntArrayEdit from './IntArrayEdit';

export default function PointEdit({ defaultValue, onValueChange }) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    onValueChange(value);
  }, [value, onValueChange]);

  return (
    <IntArrayEdit
      defaultValue={value}
      onValueChange={setValue}
      labels={['x', 'y', 'z']}
    />
  );
}

PointEdit.propTypes = {
  defaultValue: PropTypes.arrayOf(PropTypes.number),
  onValueChange: PropTypes.func.isRequired,
};

PointEdit.defaultProps = {
  defaultValue: [],
};
