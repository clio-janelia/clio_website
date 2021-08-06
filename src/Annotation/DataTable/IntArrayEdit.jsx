import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Input from '@material-ui/core/Input';

const useStyles = makeStyles(() => ({
  tightNumberInput: {
    width: '80px',
  },
}));

const getDefaultValue = (v) => {
  if (!Array.isArray(v)) {
    return [];
  }
  return v;
};

const isInteger = (v) => Number.isInteger(parseFloat(v, 10));
// const notInteger = (v) => !isInteger(v);

export default function IntArrayEdit({
  defaultValue,
  onValueChange,
  labels,
  variant,
}) {
  const [value, setValue] = useState(getDefaultValue(defaultValue));
  const classes = useStyles();

  const handleValueChange = (v, index) => {
    if (index < 0) {
      if (v.trim() === '') {
        setValue([]);
      } else if (v.includes(',')) {
        const numbers = v.split(',').map((s) => parseInt(s, 10));
        if (numbers.length === labels.length && numbers.every((n) => Number.isInteger(n))) {
          setValue(numbers);
        } else {
          setValue(defaultValue);
        }
      }
    } else if (v === '' || isInteger(v)) {
      setValue((prevValue) => {
        let newValue = [...prevValue];
        if (prevValue.length !== labels.length) {
          newValue = new Array(labels.length).fill('');
        }
        newValue[index] = v;
        return newValue;
      });
    }
  };

  useEffect(() => {
    if (value.every((v) => v === '')) {
      onValueChange([]);
    } else if (value.every(isInteger)) {
      onValueChange(value.map((v) => Number(v)));
    }
  }, [value, onValueChange]);

  let editWidget = null;

  switch (variant) {
    case 'text':
      editWidget = (
        <TextField
          variant="outlined"
          size="small"
          margin="dense"
          multiline
          defaultValue={value.join(', ')}
          onChange={(e) => handleValueChange(e.target.value, -1)}
        />
      );
      break;
    case 'line':
      editWidget = (
        <Input
          defaultValue={value.join(', ')}
          onChange={(e) => handleValueChange(e.target.value, -1)}
        />
      );
      break;
    case 'separate':
      editWidget = labels.map((label, i) => (
        <TextField
          className={classes.tightNumberInput}
          key={label}
          label={label}
          value={value.length > i ? value[i] : ''}
          variant="outlined"
          size="small"
          margin="dense"
          onInput={(e) => handleValueChange(e.target.value, i)}
        />
      ));
      break;
    default:
      break;
  }

  return (
    <div>
      {editWidget}
    </div>
  );
}

IntArrayEdit.propTypes = {
  defaultValue: PropTypes.arrayOf(PropTypes.number),
  onValueChange: PropTypes.func.isRequired,
  labels: PropTypes.arrayOf(PropTypes.string).isRequired,
  variant: PropTypes.string,
};

IntArrayEdit.defaultProps = {
  defaultValue: [],
  variant: 'line',
};
