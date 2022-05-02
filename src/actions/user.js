import C from '../reducers/constants';

export default function setUserRoles(user) {
  return (dispatch, getState) => {
    const clioUrl = getState().clio.get('projectUrl');
    const rolesUrl = `${clioUrl}/roles`;
    const options = {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    };
    return fetch(rolesUrl, options)
      .then((response) => response.json())
      .then((res) => dispatch({
        type: C.SET_USER_ROLES,
        roles: res,
      }));
  };
}

function storeFlyEMToken(user, clioUrl) {
  // TODO: get FlyEM token from clio store and save it to localStorage
  const tokenUrl = `${clioUrl}/server/token`;
  const options = {
    method: 'post',
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  };
  fetch(tokenUrl, options);
  // now store it in localStorage or a cookie.
}

export function loginGoogleUser(user) {
  return (dispatch, getState) => {
    const clioUrl = getState().clio.get('projectUrl');
    storeFlyEMToken(user, clioUrl);

    localStorage.setItem('user', JSON.stringify(user));
    dispatch(setUserRoles(user));
    dispatch({
      type: 'LOGIN_GOOGLE_USER',
      user,
    });
  };
}
