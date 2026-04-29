import Immutable from 'immutable';
import C from './constants';

// Rehydrate the user from localStorage at module-load time so the very first
// render is already authenticated. Without this, every page load briefly
// renders UnauthenticatedApp before /profile resolves. The Neuroglancer auth
// bridge is also installed synchronously here so embedded NG viewers don't
// race the /profile call.
function rehydrateGoogleUser() {
  try {
    const cached = JSON.parse(localStorage.getItem('user') || 'null');
    if (cached && cached.token && cached.info && cached.info.email) {
      window.neurohub = {
        clio: {
          auth: { getAuthResponse: () => ({ id_token: cached.token }) },
        },
      };
      return cached;
    }
  } catch (e) {
    // corrupt payload — fall through and start unauthenticated
  }
  return null;
}

const userState = Immutable.Map({
  loggedIn: false,
  userInfo: {},
  token: '',
  googleUser: rehydrateGoogleUser(),
  roles: {},
});

export default function userReducer(state = userState, action) {
  switch (action.type) {
    case C.LOGIN_USER: {
      return state.set('userInfo', action.userInfo).set('loggedIn', true);
    }
    case C.LOGOUT_USER: {
      return state
        .set('userInfo', {})
        .set('token', '')
        .set('loggedIn', false);
    }
    case C.SET_USER_TOKEN: {
      return state.set('token', action.token);
    }
    case C.SET_USER_ROLES: {
      return state.set('roles', { ...state.roles, ...action.roles });
    }
    case C.LOGIN_GOOGLE_USER: {
      return state.set('googleUser', action.user);
    }
    case C.LOGOUT_GOOGLE_USER: {
      localStorage.removeItem('user');
      return state.set('googleUser', null).set('roles', {});
    }
    default: {
      return state;
    }
  }
}
