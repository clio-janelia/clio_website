import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import { Link } from 'react-router-dom';
import GlobalSettingsAdmin from './GlobalSettingsAdmin';

export default function Settings() {
  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);
  const roles = useSelector((state) => state.user.get('roles'), shallowEqual);
  const isAdmin = roles.global_roles && roles.global_roles.includes('admin');
  return (
    <div className="about" style={{ margin: '1em' }}>
      <Typography variant="h5">Settings</Typography>
      {user && (
        <>
          <p>USER: {user.getBasicProfile().getName()}</p>
          <p>JWT: {user.getAuthResponse().id_token}</p>
        </>
      )}
      {isAdmin && (
        <>
          <Link to="/users">User Admin</Link>
          <GlobalSettingsAdmin />
        </>
      )}
    </div>
  );
}
