import React, { useState, useEffect } from 'react';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import { Link } from 'react-router-dom';
import GlobalSettingsAdmin from './GlobalSettingsAdmin';
import { addAlert } from './actions/alerts';
import { resetTopLevelUrl } from './actions/clio';

export default function Settings() {
  const [clioToken, setClioToken] = useState();
  const dispatch = useDispatch();
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
        .then((res) => {
          console.log(res);
          if (!res.ok) {
            throw new Error(`Token URL returned a ${res.status} error`);
          }
          return res.json();
        })
        .then((res) => setClioToken(res))
        .catch((e) => {
          dispatch(addAlert({
            severity: 'error',
            message: `Failed to set Top level Url: ${e.message}`,
          }));
          dispatch(resetTopLevelUrl());
          console.log(e);
        });
    }
  }, [clioUrl, user, dispatch]);

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
        <Link to="/users">User Admin</Link>
      )}
      <GlobalSettingsAdmin isAdmin={isAdmin || false} />
    </div>
  );
}
