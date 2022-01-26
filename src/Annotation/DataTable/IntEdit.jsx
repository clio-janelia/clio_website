import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Input from '@material-ui/core/Input';

const parseValue = (v) => {
  // Extract first integer from v
  const match = v.match(/^[^\d-]*((-)?\d+)/);
  if (match) {
    return Number(match[1]);
  }
  return undefined;
};

const useStyles = makeStyles((theme) => ({
  validInput: {
    color: 'black',
  },
  invalidInput: {
    color: theme.palette.error.main,
  },
}));

/**
 * A component for editing an integer value.
 */
export default function IntEdit({
  defaultValue,
  minimum,
  maximum,
  onValueChange,
  placeholder,
}) {
  const [value, setValue] = useState(() => (typeof defaultValue === 'string' ? parseValue(defaultValue) : defaultValue));
  const classes = useStyles();

  const isValidValue = React.useCallback(
    (v) => v === undefined
      || ((minimum === undefined || v >= minimum)
        && (maximum === undefined || v <= maximum)),
    [minimum, maximum],
  );
  const handleValueChange = (v) => setValue(parseValue(v));

  useEffect(() => {
    onValueChange(isValidValue(value) ? value : undefined);
  }, [value, isValidValue, onValueChange]);

  return (
    <Input
      className={isValidValue(value) ? classes.validInput : classes.invalidInput}
      value={(value === undefined) ? '' : value}
      onChange={(event) => handleValueChange(event.target.value)}
      placeholder={placeholder}
    />
  );
}

IntEdit.propTypes = {
  /**
   * Default value, which will be parsed into an integer when it is a string.
   * The parsing tries to extract the first integer from the string.
   * The stated value will be set to undefined when no integer can be extracted from the string.
   * */
  defaultValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Minimal value allowed. Undefined means no limitation. */
  minimum: PropTypes.number,
  /** Maximal value allowed. Undefined means no limitation. */
  maximum: PropTypes.number,
  /** Callback function called when the value changes. */
  onValueChange: PropTypes.func.isRequired,
  /** Placeholder text. */
  placeholder: PropTypes.string,
};

IntEdit.defaultProps = {
  defaultValue: undefined,
  minimum: undefined,
  maximum: undefined,
  placeholder: undefined,
};
