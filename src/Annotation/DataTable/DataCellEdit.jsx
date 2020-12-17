import React from 'react';

import PropTypes from 'prop-types';
import Input from '@material-ui/core/Input';

export default function DataCellEdit(props) {
  const { value, placeholder, onValueChange } = props;
  const [inputValue, setInputValue] = React.useState(value);

  const handleValueChange = (event) => {
    setInputValue(event.target.value);
    onValueChange(event.target.value);
  };

  return (
    <Input
      value={inputValue}
      placeholder={placeholder}
      onChange={handleValueChange}
    />
  );
}

DataCellEdit.propTypes = {
  value: PropTypes.string.isRequired,
  onValueChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

DataCellEdit.defaultProps = {
  placeholder: '',
};
