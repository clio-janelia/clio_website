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
import IntEdit from './IntEdit';
import { FIELD_PROP_TYPES } from './DataTableUtils';

/**
 * Widget for editing a single data table cell.
 */
export default function DataCellEdit(props) {
  const {
    defaultValue, onValueChange, onValueRestore, onValueInvalid, config, editElement,
  } = props;
  const [inputValue, setInputValue] = useState(
    config.normalize ? config.normalize(defaultValue) : defaultValue,
  );
  const { field } = config;

  useEffect(() => {
    let handleChange;
    if (config.validate && !config.validate(inputValue)) {
      handleChange = onValueInvalid || onValueRestore;
    }

    if (!handleChange) {
      const normalizedValue = config.normalize ? config.normalize(inputValue) : inputValue;
      if (onValueRestore && JSON.stringify(normalizedValue) === JSON.stringify(defaultValue)) {
        handleChange = onValueRestore;
      }
      if (!handleChange) {
        handleChange = (field_) => onValueChange(field_, normalizedValue);
      }
    }
    handleChange(field);
  }, [field, defaultValue, inputValue, onValueChange, onValueRestore, onValueInvalid, config]);

  const handleInputChange = (event, getTargetValue) => {
    if (event) {
      const targetValue = getTargetValue(event.target);
      setInputValue(targetValue);
    }
  };

  const handleTextChange = (event) => handleInputChange(event, (target) => target.textContent);

  const handleValueChange = (event) => handleInputChange(event, (target) => target.value);

  const handleChecked = (event) => handleInputChange(event, (target) => target.checked);

  let widget = <div>{defaultValue || ''}</div>;
  const { jsonSchema } = config;
  switch (editElement.type) {
    case 'input':
      if (editElement.options) {
        widget = (
          <AutoComplete
            freeSolo
            options={editElement.options}
            defaultValue={defaultValue || ''}
            onInputChange={(event, newValue) => handleInputChange(event, () => newValue)}
            onChange={handleTextChange}
            /* eslint-disable-next-line react/jsx-props-no-spreading */
            renderInput={(params) => <TextField {...params} />}
          />
        );
      } else {
        widget = (
          <Input
            defaultValue={defaultValue || ''}
            placeholder={config.placeholder || ''}
            onChange={handleValueChange}
          />
        );
      }
      break;
    case 'integer':
      widget = (
        <IntEdit
          defaultValue={defaultValue}
          minimum={jsonSchema && jsonSchema.minimum}
          maximum={jsonSchema && jsonSchema.maximum}
          onValueChange={setInputValue}
        />
      );
      break;
    case 'list':
      widget = (
        <StringListEdit
          value={defaultValue || []}
          onChange={setInputValue}
        />
      );
      break;
    case 'select':
      widget = (
        <Select onChange={handleValueChange} defaultValue={defaultValue || ''}>
          {
            editElement.options.map((option) => (
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
            <Checkbox onChange={handleChecked} defaultChecked={defaultValue} />
          }
        />
      );
      break;
    case 'point':
      widget = (
        <PointEdit
          defaultValue={defaultValue || []}
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
  defaultValue: PropTypes.oneOfType(
    [
      PropTypes.string,
      PropTypes.bool,
      PropTypes.number,
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.arrayOf(PropTypes.number),
    ],
  ),
  onValueChange: PropTypes.func.isRequired,
  onValueRestore: PropTypes.func,
  onValueInvalid: PropTypes.func,
  config: PropTypes.shape(FIELD_PROP_TYPES).isRequired,
  editElement: PropTypes.shape({
    type: PropTypes.string.isRequired,
  }).isRequired,
};

DataCellEdit.defaultProps = {
  defaultValue: undefined,
};
