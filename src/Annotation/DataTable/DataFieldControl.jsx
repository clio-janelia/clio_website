import React from 'react';
import PropTypes from 'prop-types';

import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import Checkbox from '@material-ui/core/Checkbox';

function renderSelectValue(fields, value) {
  const titles = fields.filter((field) => value.includes(field.field))
    .map((field) => field.title);
  return `${(titles.length <= 3) ? titles.join(', ') : `${titles[0]}, ${titles[1]}, ..., ${titles[titles.length - 1]}`}`;
}

function DataFieldControl({
  fields, selectedFields, onChange, fieldHint,
}) {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <div>
      <FormControl style={{ width: '250px' }}>
        <InputLabel id="field-label">Fields</InputLabel>
        <Select
          labelId="field-label"
          id="fieldSelection"
          input={<Input />}
          value={selectedFields}
          renderValue={(value) => renderSelectValue(fields, value)}
          multiple
          onChange={handleChange}
        >
          {fields.map((field) => (
            <MenuItem key={field.field} value={field.field}>
              <Checkbox checked={selectedFields.includes(field.field)} />
              {`${field.title}${(fieldHint && field.title !== field.field) ? ` (${field.field})` : ''}`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}

DataFieldControl.propTypes = {
  fields: PropTypes.arrayOf(PropTypes.shape({
    field: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  })).isRequired,
  selectedFields: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  fieldHint: PropTypes.bool,
};

DataFieldControl.defaultProps = {
  fieldHint: false,
};

export default DataFieldControl;
