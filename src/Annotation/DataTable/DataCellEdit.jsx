import React, { useState, useEffect } from 'react';

import PropTypes from 'prop-types';
import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';
import AutoComplete from '@material-ui/lab/Autocomplete';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import MenuItem from '@material-ui/core/MenuItem';
import StringListEdit from './StringListEdit';
import PointEdit from './PointEdit';

export default function DataCellEdit(props) {
  const {
    field, value, placeholder, onValueChange, config,
  } = props;
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    if (value !== inputValue) {
      console.debug('DataCellEdit useEffect:', field, inputValue);
      onValueChange(field, inputValue);
    }
  }, [field, value, inputValue, onValueChange]);

  const handleInputChange = (event, getTargetValue) => {
    if (event) {
      const targetValue = getTargetValue(event.target);
      setInputValue(targetValue);
    }
  };

  const handleTextChange = (event) => handleInputChange(event, (target) => target.textContent);

  const handleValueChange = (event) => handleInputChange(event, (target) => target.value);

  const handleChecked = (event) => handleInputChange(event, (target) => target.checked);

  let widget = <div>{value || ''}</div>;
  switch (config.type) {
    case 'input':
      if (config.options) {
        widget = (
          <AutoComplete
            freeSolo
            options={config.options}
            inputValue={inputValue || ''}
            onInputChange={(event, newValue) => handleInputChange(event, () => newValue)}
            onChange={handleTextChange}
            /* eslint-disable-next-line react/jsx-props-no-spreading */
            renderInput={(params) => <TextField {...params} />}
          />
        );
      } else {
        widget = (
          <Input
            value={inputValue || ''}
            placeholder={placeholder}
            onChange={handleValueChange}
          />
        );
      }
      break;
    case 'list':
      widget = (
        <StringListEdit
          value={inputValue || []}
          onChange={setInputValue}
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
    case 'point':
      widget = (
        <PointEdit
          defaultValue={inputValue || []}
          onValueChange={setInputValue}
        />
      );
      break;
    default:
      break;
  }

  return widget;
}

DataCellEdit.propTypes = {
  field: PropTypes.string.isRequired,
  value: PropTypes.oneOfType(
    [
      PropTypes.string,
      PropTypes.bool,
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.arrayOf(PropTypes.number),
    ],
  ),
  onValueChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  config: PropTypes.shape({
    type: PropTypes.string,
  }).isRequired,
};

DataCellEdit.defaultProps = {
  value: undefined,
  placeholder: '',
};
