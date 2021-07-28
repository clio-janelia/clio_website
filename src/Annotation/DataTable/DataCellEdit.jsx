import React from 'react';

import PropTypes from 'prop-types';
import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';
import AutoComplete from '@material-ui/lab/Autocomplete';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import MenuItem from '@material-ui/core/MenuItem';
import StringListEdit from './StringListEdit';

export default function DataCellEdit(props) {
  const {
    value, placeholder, onValueChange, config,
  } = props;
  const [inputValue, setInputValue] = React.useState(value);

  const handleInputChange = (event, getTargetValue) => {
    if (event) {
      const targetValue = getTargetValue(event.target);
      setInputValue(targetValue);
      onValueChange(targetValue);
    }
  };

  const handleTextChange = (event) => handleInputChange(event, (target) => target.textContent);

  const handleValueChange = (event) => handleInputChange(event, (target) => target.value);

  const handleChecked = (event) => handleInputChange(event, (target) => target.checked);

  const handleListChange = (list) => {
    setInputValue(list);
    onValueChange(list);
  };

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
          onChange={handleListChange}
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
  value: PropTypes.oneOfType(
    [PropTypes.string, PropTypes.bool, PropTypes.arrayOf(PropTypes.string)],
  ),
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
