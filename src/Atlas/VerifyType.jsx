import React from 'react';
import PropTypes from 'prop-types';

import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Input from '@material-ui/core/Input';

export default function VerifyType({ selected, onChange }) {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <div>
      <FormControl style={{ width: '150px' }}>
        <InputLabel id="verifyType-label">Verification status</InputLabel>
        <Select
          labelId="verifyType-label"
          id="verifyType"
          value={selected}
          onChange={handleChange}
          input={<Input />}
        >
          <MenuItem key="any" value="Verified or unverified">Verified or unverified</MenuItem>
          <MenuItem key="unverified" value="Unverified">Unverified</MenuItem>
          <MenuItem key="verified" value="Verified">Verified</MenuItem>
        </Select>
      </FormControl>
    </div>
  );
}

VerifyType.propTypes = {
  selected: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
