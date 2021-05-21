import React, { useState, useEffect } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import { Link } from 'react-router-dom';
import GlobalSettingsAdmin from './GlobalSettingsAdmin';

export default function Settings() {
  const [clioToken, setClioToken] = useState();
  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);
  const roles = useSelector((state) => state.user.get('roles'), shallowEqual);
  const isAdmin = roles.global_roles && roles.global_roles.includes('admin');
  const clioUrl = useSelector((state) => state.clio.get('projectUrl'), shallowEqual);

  useEffect(() => {
    if (user && clioUrl) {
      const options = {
        method: 'post',
        headers: {
          Authorization: `Bearer ${user.getAuthResponse().id_token}`,
        },
      };

      const tokenUrl = `${clioUrl}/server/token`;

      fetch(tokenUrl, options)
        .then((res) => res.json())
        .then((res) => setClioToken(res));
    }
  }, [clioUrl, user]);

  return (
    <div className="about" style={{ margin: '1em' }}>
      <Typography variant="h5">Settings</Typography>
      {user && (
        <>
          <p>USER: {user.getBasicProfile().getName()}</p>
          <p>Google ID Token: </p>
          <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {user.getAuthResponse().id_token}
          </pre>
          <p>ClioStore/DVID Token: </p>
          <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {clioToken || 'loading...'}
          </pre>
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
