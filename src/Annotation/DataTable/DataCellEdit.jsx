import React from 'react';

import PropTypes from 'prop-types';
import Input from '@material-ui/core/Input';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

export default function DataCellEdit(props) {
  const {
    value, placeholder, onValueChange, config,
  } = props;
  const [inputValue, setInputValue] = React.useState(value);

  const handleValueChange = (event) => {
    setInputValue(event.target.value);
    onValueChange(event.target.value);
  };

  let widget = <div>{value}</div>;
  switch (config.type) {
    case 'input':
      widget = (
        <Input
          value={inputValue}
          placeholder={placeholder}
          onChange={handleValueChange}
        />
      );
      break;
    case 'select':
      widget = (
        <Select onChange={handleValueChange} value={inputValue}>
          {
            config.options.map((option) => (
              <MenuItem
                key={option.label}
                value={option.value}
              >
                {option.label}
              </MenuItem>
            ))
          }
        </Select>
      );
      break;
    default:
      break;
  }

  return widget;
}

DataCellEdit.propTypes = {
  value: PropTypes.string.isRequired,
  onValueChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  config: PropTypes.shape({
    type: PropTypes.string,
  }).isRequired,
};

DataCellEdit.defaultProps = {
  placeholder: '',
};
