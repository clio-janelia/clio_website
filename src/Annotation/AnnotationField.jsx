import React from 'react';
import PropTypes from 'prop-types';

import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import Checkbox from '@material-ui/core/Checkbox';
// import { useTheme } from '@material-ui/styles';

function AnnotationField({ groups, selectedGroups, onChange }) {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <div>
      <FormControl style={{ width: '200px' }}>
        <InputLabel id="group-label">User Groups</InputLabel>
        <Select
          labelId="group-label"
          id="groupSelection"
          input={<Input />}
          value={selectedGroups}
          renderValue={(value) => value.join(', ')}
          multiple
          onChange={handleChange}
        >
          {groups.map((group) => (
            <MenuItem key={group} value={group}>
              <Checkbox checked={selectedGroups.indexOf(group) >= 0} />
              {group}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}

AnnotationField.propTypes = {
  groups: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedGroups: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default AnnotationField;
