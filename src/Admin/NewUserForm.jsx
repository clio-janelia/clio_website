import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, shallowEqual } from 'react-redux';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

const baseSettings = {
  global_roles: ['clio_general'],
};

export default function NewUserForm({ onUpdate }) {
  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);
  const clioUrl = useSelector((state) => state.clio.get('projectUrl'), shallowEqual);
  const [userName, setUserName] = useState('');
  const [permissions, setPermissions] = useState(baseSettings);

  const handleUserChange = (event) => {
    setUserName(event.target.value);
  };

  const handlePermissionsChange = (event) => {
    setPermissions(JSON.parse(event.target.value));
  };
  const handleSubmit = () => {
    // TODO: validation
    // submit the data to the clio_toplevel/users end point.
    const usersUrl = `${clioUrl}/users`;

    if (userName === '') {
      return;
    }
    const modifiedPermissions = {
      ...permissions,
      email: userName,
    };

    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({
        [userName]: modifiedPermissions,
      }),
    };

    fetch(usersUrl, options)
      .then((response) => response.text())
      .then(() => {
        onUpdate({ [userName]: permissions });
      });
  };

  return (
    <form noValidate autoComplete="off">
      <Typography>Create a new User</Typography>
      <Grid container space={3}>
        <Grid item xs={12}>
          <TextField
            id="username"
            required
            label="Email address"
            variant="outlined"
            value={userName}
            onChange={handleUserChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            id="permissions"
            required
            label="Permissions"
            variant="outlined"
            value={JSON.stringify(permissions)}
            multiline
            onChange={handlePermissionsChange}
          />
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Create
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}

NewUserForm.propTypes = {
  onUpdate: PropTypes.func.isRequired,
};
