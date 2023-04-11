import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';

import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';

import { addAlert } from './actions/alerts';
import { setToplevelUrl } from './actions/clio';
import config from './config';

const productionUrl = `${config.projectBaseUrlDefault}/${config.top_level_function}`;
const testUrl = `${config.projectBaseUrlTest}/${config.top_level_function}`;

export default function GlobalSettingsAdmin({ isAdmin }) {
  const dispatch = useDispatch();
  const clioUrl = useSelector((state) => state.clio.get('projectUrl'), shallowEqual);
  const [toplevelUrl, setTopLevel] = useState(clioUrl);
  const handleTopLevelChange = (event) => {
    setTopLevel(event.target.value);
  };

  const persistData = () => {
    dispatch(setToplevelUrl(toplevelUrl));
  };

  const handleTopLevelSwitch = (event) => {
    setTopLevel(event.target.value);
    dispatch(setToplevelUrl(event.target.value));
    dispatch(addAlert({
      severity: 'success',
      message: 'Clio store url changed and saved',
    }));
  };

  return (
    <div>
      <h3>Global Settings</h3>
      <p><b>ClioStore url:</b> {toplevelUrl}</p>
      <FormControl component="fieldset">
        <FormLabel component="legend">Clio Store</FormLabel>
        <RadioGroup
          aria-label="clio store url"
          name="clio_store_url"
          value={toplevelUrl}
          onChange={handleTopLevelSwitch}
        >
          <FormControlLabel value={productionUrl} control={<Radio />} label="Production" />
          <FormControlLabel value={testUrl} control={<Radio />} label="Test" />
        </RadioGroup>
      </FormControl>

      {isAdmin ? (
        <div>
          <TextField
            id="top_level_url"
            onChange={handleTopLevelChange}
            label="Top Level URL"
            variant="outlined"
            fullWidth
            value={toplevelUrl}
          />
          <Button color="primary" variant="contained" onClick={persistData}>
            Save
          </Button>
        </div>
      ) : (
        ''
      )}
    </div>
  );
}

GlobalSettingsAdmin.propTypes = {
  isAdmin: PropTypes.bool.isRequired,
};
