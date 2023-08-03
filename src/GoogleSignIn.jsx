/* eslint-disable no-underscore-dangle, camelcase */
import { Button } from '@material-ui/core';
import Avatar from '@material-ui/core/Avatar';
import Tooltip from '@material-ui/core/Tooltip';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import jwt_decode from 'jwt-decode';
import { loginGoogleUser } from './actions/user';
import config from './config';

export default function GoogleSignin() {
  const [gsiScriptLoaded, setGsiScriptLoaded] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);

  const handleGoogleSignIn = (res) => {
    if (!res.clientId || !res.credential) {
      return;
    }

    const userDetails = jwt_decode(res.credential);

    // Implement your login mutations and logic here.
    // Set cookies, call your backend, etc.
    dispatch(loginGoogleUser({ token: res.credential, info: userDetails }));
  };

  useEffect(() => {
    if ((user && user.info) || gsiScriptLoaded) {
      return;
    }

    const initializeGsi = () => {
      // Typescript will complain about window.google
      // Add types to your `react-app-env.d.ts` or //@ts-ignore it.
      if (!window.google || gsiScriptLoaded) return;

      setGsiScriptLoaded(true);
      window.google.accounts.id.initialize({
        client_id: config.google_auth.client_id,
        callback: handleGoogleSignIn,
      });
      // window.google.accounts.id.prompt();
      if (document.getElementById('loginButton')) {
        window.google.accounts.id.renderButton(
          document.getElementById('loginButton'),
          { theme: 'outline', size: 'medium', shape: 'pill' }, // customization attributes
        );
      }
    };

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = initializeGsi;
    script.async = true;
    script.id = 'google-client-script';
    document.querySelector('body').appendChild(script);

    // eslint-disable-next-line consistent-return
    return () => {
      // Cleanup function that runs when component unmounts
      if (window.google && window.google.accounts) {
        window.google.accounts.id.cancel();
        document.getElementById('google-client-script').remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleGoogleSignIn, user]);

  function handleLogout() {
    dispatch({
      type: 'LOGOUT_GOOGLE_USER',
      user,
    });
  }

  if (user) {
    return (
      <Tooltip title="logout">
        <Button color="inherit" onClick={() => handleLogout()}>
          <Avatar
            alt={user.info.name}
            src={user.info.picture}
          />
        </Button>
      </Tooltip>
    );
  }

  // login prompt goes here, so that it isn't displayed if we are
  // already showing the logged in avatar.
  if (window.google && window.google.accounts) {
    window.google.accounts.id.prompt();
  }

  return <Button className="g_id_signin" id="loginButton" />;
}
