/* eslint-disable camelcase */
import jwt_decode from 'jwt-decode';
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

function exchangeForFlyEMToken(user, clioUrl) {
  return (dispatch) => {
    // get FlyEM token from clio store and save it to localStorage
    const tokenUrl = `${clioUrl}/server/token`;
    const options = {
      method: 'post',
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    };
    fetch(tokenUrl, options)
      .then((response) => response.json())
      .then((res) => {
        const userDetails = jwt_decode(res);
        const updatedUser = { token: res, info: userDetails };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        dispatch({
          type: 'LOGIN_GOOGLE_USER',
          user: updatedUser,
        });
        dispatch(setUserRoles(updatedUser));
      }).catch((err) => console.log(err));
  };
}

export function loginGoogleUser(user) {
  return (dispatch, getState) => {
    const clioUrl = getState().clio.get('projectUrl');
    if (user.info.iss === 'flyem-clio-store') {
      // token has already been exchanged, so just set it in memory
      dispatch({
        type: 'LOGIN_GOOGLE_USER',
        user,
      });
      dispatch(setUserRoles(user));
    } else {
      dispatch(exchangeForFlyEMToken(user, clioUrl, dispatch));
    }
  };
}
