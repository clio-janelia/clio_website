import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import Button from '@material-ui/core/Button';
import Avatar from '@material-ui/core/Avatar';
import Tooltip from '@material-ui/core/Tooltip';
import { loginGoogleUser } from './actions/user';

import loadScript from './utils/load-script';

export default function Login({ fullWidth }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);

  function handleLogout() {
    const ga = window.gapi.auth2.getAuthInstance();
    dispatch({
      type: 'LOGOUT_GOOGLE_USER',
      user: ga,
    });
  }

  // if logged in, return logout button? user profile image.
  if (user) {
    return (
      <Tooltip title="logout">
        <Button color="inherit" onClick={() => handleLogout()}>
          <Avatar
            alt={user.getBasicProfile().getName()}
            src={user.getBasicProfile().getImageUrl()}
          />
        </Button>
      </Tooltip>
    );
  }

  function handleLoggedIn(googleUser) {
    dispatch(loginGoogleUser(googleUser));
  }

  function signIn() {
    const ga = window.gapi.auth2.getAuthInstance();

    if (ga.isSignedIn.get()) {
      dispatch(loginGoogleUser(ga.currentUser.get()));
    } else {
      const result = ga.signIn();
      result.then(
        (googleUser) => {
          handleLoggedIn(googleUser);
        },
        (error) => {
          console.log('Google Login Error: ', error);
        },
      );
    }
  }

  function handleLogin() {
    if (!window.gapi || !window.gapi.auth2) {
      const jsSrc = 'https://apis.google.com/js/platform.js';
      loadScript(document, 'script', 'google-login', jsSrc, () => {
        signIn();
      });
    } else {
      signIn();
    }
  }

  return (
    <Button fullWidth={fullWidth} color="inherit" onClick={() => handleLogin()}>
      Login
    </Button>
  );
}

Login.propTypes = {
  fullWidth: PropTypes.bool,
};

Login.defaultProps = {
  fullWidth: false,
};
