import React from 'react';

import PropTypes from 'prop-types';
import Input from '@material-ui/core/Input';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import MenuItem from '@material-ui/core/MenuItem';

export default function DataCellEdit(props) {
  const {
    value, placeholder, onValueChange, config,
  } = props;
  const [inputValue, setInputValue] = React.useState(value);

  const handleInputChange = (event, getTargetValue) => {
    const tartetValue = getTargetValue(event.target);
    setInputValue(tartetValue);
    onValueChange(tartetValue);
  };

  const handleValueChange = (event) => handleInputChange(event, (target) => target.value);

  const handleChecked = (event) => handleInputChange(event, (target) => target.checked);

  let widget = <div>{value || ''}</div>;
  switch (config.type) {
    case 'input':
      widget = (
        <Input
          value={inputValue || ''}
          placeholder={placeholder}
          onChange={handleValueChange}
        />
      );
      break;
    case 'select':
      widget = (
        <Select onChange={handleValueChange} value={inputValue || ''}>
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
    case 'boolean':
      widget = (
        <FormControlLabel
          control={
            <Checkbox onChange={handleChecked} checked={inputValue} />
          }
        />
      );
      break;
    default:
      break;
  }

  return widget;
}

DataCellEdit.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  onValueChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  config: PropTypes.shape({
    type: PropTypes.string,
  }).isRequired,
};

DataCellEdit.defaultProps = {
  value: null,
  placeholder: '',
};
