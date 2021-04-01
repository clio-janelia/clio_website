import React, { useState } from 'react';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import setTopLevelFunction from './actions/clio';

export default function GlobalSettingsAdmin() {
  const dispatch = useDispatch();
  const clioUrl = useSelector((state) => state.clio.get('projectUrl'), shallowEqual);
  const [toplevelUrl, setTopLevel] = useState(clioUrl);
  const handleTopLevelChange = (event) => {
    setTopLevel(event.target.value);
  };

  const persistData = () => {
    dispatch(setTopLevelFunction(toplevelUrl));
  };

  return (
    <div>
      <p>Global Settings</p>
      <TextField
        id="top_level_url"
        onChange={handleTopLevelChange}
        label="Top Level URL"
        variant="outlined"
        fullWidth
        value={toplevelUrl}
      />
      <Button color="primary" variant="contained" onClick={persistData}>Save</Button>
    </div>
  );
}
