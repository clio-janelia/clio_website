import React, { useEffect, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import AutoComplete from '@material-ui/lab/Autocomplete';

const useStyles = makeStyles((theme) => ({
  validInput: {
    color: 'black',
  },
  invalidInput: {
    color: theme.palette.error.main,
  },
}));

/**
 * A component for editing a value with an arbitary type.
 *
 * It allows the user to edit a value by typing in a single text field. The
 * domain of the value is defined by the `parse` and `validate` function.
 * `parse` maps the string into a superset of the value domain and `validate`
 * checks the mapped value is in the real domain. Using a domain superset allows
 * typing intermediate values that are not in the real domain. `normalizeInput`
 * is used to prevent the user from typing invalid values that cannot be
 * intermediate. Whenever the input is changed and its mapped value is valid,
 * onValueChange will be called to respond to the change, even though the mapped
 * value stays the same.
 */
export default function MonoEdit({
  validate,
  parse,
  stringfy,
  validateInput,
  normalizeInput,
  onValueChange,
  onInvalidValue,
  defaultValue,
  placeholder,
  options,
}) {
  const [inputText, setInputText] = useState(stringfy(defaultValue));
  const classes = useStyles();
  const [className, setClassName] = useState(null);

  const isValid = useMemo(() => validate(parse(inputText)), [inputText, validate, parse]);

  useEffect(() => {
    setClassName(isValid ? classes.validInput : classes.invalidInput);
  }, [isValid, classes]);

  useEffect(() => {
    const value = parse(inputText);
    if (validate(value)) {
      onValueChange(value);
    } else {
      onInvalidValue(value);
    }
  }, [inputText, onValueChange, onInvalidValue, parse, validate]);

  const handleInputChange = useCallback((input) => {
    const normalizedInput = normalizeInput(input);
    if (validateInput(normalizedInput)) {
      setInputText(normalizedInput);
    }
  }, [validateInput, normalizeInput]);

  if (options) {
    return <AutoComplete
      freeSolo
      classes={{inputRoot: className}}
      options={options.map(option => stringfy(option))}
      getOptionLabel={(option) => stringfy(option)}
      renderInput={(params) => (
        <TextField
          {...params}
          error={!isValid}
        />
      )}
      onInputChange={(_, value) => handleInputChange(value)}
      inputValue={inputText}
      placeholder={placeholder}
    />
  }

  return (
    <TextField
      error={!isValid}
      className={className}
      value={inputText}
      onChange={(event) => handleInputChange(event.target.value)}
      placeholder={placeholder}
    />
  );
}

MonoEdit.propTypes = {
  /** Check if a parsed value is valid */
  validate: PropTypes.func.isRequired,
  /** Convert a string to the actual value */
  parse: PropTypes.func.isRequired,
  /** Convert a value to a string */
  stringfy: PropTypes.func.isRequired,
  /** Check if an input is valid. Invalid input will not show up in the edit area */
  validateInput: PropTypes.func,
  /** Map an input to a normalized one */
  normalizeInput: PropTypes.func,
  /** Callback for any value change */
  onValueChange: PropTypes.func.isRequired,
  /** Callback for any invalid value produced from the input */
  onInvalidValue: PropTypes.func.isRequired,
  /** Default value in the value domain */
  defaultValue: PropTypes.any,
  /** Placeholder for the edit area */
  placeholder: PropTypes.string,
  /** Predefined value candidates */
  options: PropTypes.array,
};

MonoEdit.defaultProps = {
  validateInput: (_) => true,
  normalizeInput: (input) => input,
  defaultValue: undefined,
  placeholder: undefined,
  options: undefined,
};
