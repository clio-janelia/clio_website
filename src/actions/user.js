/* eslint-disable camelcase */
import jwt_decode from 'jwt-decode';
import C from '../reducers/constants';
import { authBaseFromProjectUrl, normalizeTokenResponse } from '../utils/auth';

export const DSG_TOKEN_CACHE_KEY = 'clio_dsg_token';

export default function setUserRoles(user) {
  return (dispatch, getState) => {
    const clioUrl = getState().clio.get('projectUrl');
    const rolesUrl = `${clioUrl}/roles`;
    const options = {
      credentials: 'include',
      headers: user && user.token ? { Authorization: `Bearer ${user.token}` } : {},
    };
    return fetch(rolesUrl, options)
      .then((response) => response.json())
      .then((res) => dispatch({
        type: C.SET_USER_ROLES,
        roles: res,
      }));
  };
}

function getSessionStorage() {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage;
}

// The Neuroglancer fork reads window.neurohub.clio.auth.getAuthResponse()
// to fetch the current bearer token when it talks to clio-store.
function installNeurohubBridge(token) {
  window.neurohub = {
    clio: {
      auth: {
        getAuthResponse: () => ({ id_token: token }),
      },
    },
  };
}

function loadCachedToken(profileEmail) {
  const storage = getSessionStorage();
  if (!storage) return null;

  try {
    const cached = JSON.parse(storage.getItem(DSG_TOKEN_CACHE_KEY) || 'null');
    if (cached && cached.token && cached.email === profileEmail) {
      return cached.token;
    }
  } catch (e) {
    // corrupt payload; fall through and re-fetch
  }
  return null;
}

function cacheToken(user) {
  const storage = getSessionStorage();
  if (!storage || !user || !user.token || !user.info || !user.info.email) return;

  try {
    storage.setItem(DSG_TOKEN_CACHE_KEY, JSON.stringify({
      email: user.info.email,
      token: user.token,
    }));
  } catch (e) {
    // Token caching is only an optimization.
  }
}

function clearCachedToken() {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.removeItem(DSG_TOKEN_CACHE_KEY);
  } catch (e) {
    // Token caching is only an optimization.
  }
}

function buildUserFromProfile(profile, token) {
  return {
    token,
    info: {
      email: profile.email,
      name: profile.name || profile.email,
      picture: profile.picture || '',
      dsg_url: profile.dsg_url || null,
      datasets_ignore_tos: profile.datasets_ignore_tos || {},
      missing_tos: profile.missing_tos || [],
    },
  };
}

function persistAndDispatchUser(user, dispatch) {
  cacheToken(user);
  installNeurohubBridge(user.token);
  dispatch({ type: C.LOGIN_GOOGLE_USER, user });
  dispatch(setUserRoles(user));
}

// DSG-mode login: confirm the browser's dsg_token cookie is valid by calling
// /profile, then (if this tab does not already have one cached) request the user's
// stable long-lived DSG API token to use as a Bearer elsewhere. The
// clio-store /server/token proxy hits DSG's idempotent long_lived_token
// endpoint, so the same token is returned on every call. Only the token is
// cached, and only in sessionStorage, because profile fields like missing_tos
// can change in DSG while this app is open.
export function loginDSGUser() {
  return (dispatch, getState) => {
    const clioUrl = getState().clio.get('projectUrl');
    const authBase = authBaseFromProjectUrl(clioUrl);

    return fetch(`${authBase}/profile`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => {
        if (!profile || !profile.email) {
          // Definitive negative response from the backend — clear any
          // current user so the UI doesn't keep rendering as logged in.
          clearCachedToken();
          dispatch({ type: C.LOGOUT_GOOGLE_USER });
          return null;
        }

        const cachedToken = loadCachedToken(profile.email);
        if (cachedToken) {
          const refreshed = buildUserFromProfile(profile, cachedToken);
          persistAndDispatchUser(refreshed, dispatch);
          return refreshed;
        }

        return fetch(`${clioUrl}/server/token`, {
          method: 'POST',
          credentials: 'include',
        })
          .then((res) => {
            if (!res.ok) throw new Error(`token fetch failed: ${res.status}`);
            return res.text();
          })
          .then((raw) => {
            let token = raw.trim();
            try {
              token = normalizeTokenResponse(JSON.parse(raw)) || token;
            } catch (e) {
              // raw string — keep as-is
            }
            token = token.replace(/^"|"$/g, '');

            const user = buildUserFromProfile(profile, token);
            persistAndDispatchUser(user, dispatch);
            return user;
          });
      })
      .catch((err) => {
        console.warn('DSG auth check failed:', err);
        return null;
      });
  };
}

export function logoutDSGUser() {
  return (dispatch, getState) => {
    const clioUrl = getState().clio.get('projectUrl');
    const authBase = authBaseFromProjectUrl(clioUrl);

    clearCachedToken();
    dispatch({ type: C.LOGOUT_GOOGLE_USER });

    // Navigate the browser to clio-store /logout, which:
    //   (1) invalidates the DSG APIKey server-side,
    //   (2) clears the dsg_token cookie (Domain=.janelia.org),
    //   (3) 302s back to this page with no cookie → the site renders logged-out.
    const redirect = encodeURIComponent(window.location.origin);
    window.location.href = `${authBase}/logout?redirect=${redirect}`;
  };
}

// --- Legacy Google-Sign-In path (non-DSG clio-store) ---

function exchangeForFlyEMToken(user, clioUrl) {
  return (dispatch) => {
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
          type: C.LOGIN_GOOGLE_USER,
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
      dispatch({
        type: C.LOGIN_GOOGLE_USER,
        user,
      });
      dispatch(setUserRoles(user));
    } else {
      dispatch(exchangeForFlyEMToken(user, clioUrl, dispatch));
    }
  };
}
