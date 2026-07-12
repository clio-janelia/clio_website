import Immutable from 'immutable';
import config from '../config';

const defaultProjectUrl = `${config.projectBaseUrlDefault}/${config.top_level_function}`;

// Backends from older builds that no longer exist. A browser that persisted one
// of these as clio.projectUrl would otherwise stay stuck on a dead backend after
// a redeploy, so we rewrite any of them to the current default. Add a base here
// whenever projectBaseUrlDefault/Test is repointed away from a previously-live
// backend.
const LEGACY_PROJECT_BASES = [
  'https://emdata7.janelia.org',
  'https://emdata7.janelia.org/clio-store',
  'https://clio-dev.janelia.org:8080',
  'https://clio-store-dsg-464281314980.us-east4.run.app',
];

function normalizeProjectUrl(projectUrl) {
  if (!projectUrl) return projectUrl;

  const topLevel = config.top_level_function;
  const matchesBase = (base) => {
    const b = base.replace(/\/$/, '');
    return projectUrl === b
      || projectUrl === `${b}/`
      || projectUrl === `${b}/${topLevel}`
      || projectUrl === `${b}/${topLevel}/`;
  };

  if (LEGACY_PROJECT_BASES.some(matchesBase)) {
    return defaultProjectUrl;
  }

  return projectUrl;
}

function normalizePersistedState(state) {
  if (state && state.clio && state.clio.projectUrl) {
    // eslint-disable-next-line prefer-object-spread
    const clio = Object.assign({}, state.clio, {
      projectUrl: normalizeProjectUrl(state.clio.projectUrl),
    });

    // eslint-disable-next-line prefer-object-spread
    return Object.assign({}, state, { clio });
  }
  return state;
}

// Returns true local storage is availble.
// Adapted from:
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
export default () => {
  try {
    const x = '__storage_test__';
    localStorage.setItem(x, x);
    localStorage.removeItem(x);
    return true;
  } catch (e) {
    return (e instanceof DOMException) && (
      // everything except Firefox
      e.code === 22
      // Firefox
      || e.code === 1014
      // test name field too, because code might not be present
      // everything except Firefox
      || e.name === 'QuotaExceededError'
      // Firefox
      || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
      // acknowledge QuotaExceededError only if there's something already stored
      && (localStorage && localStorage.length !== 0);
  }
};

export const loadState = () => {
  try {
    const serializedState = localStorage.getItem('clio_web_state');
    if (serializedState === null) {
      return undefined;
    }
    const state = normalizePersistedState(JSON.parse(serializedState));
    const Immutabled = {};
    Object.keys(state).forEach((key) => {
      Immutabled[key] = Immutable.fromJS(state[key]);
    });
    return Immutabled;
    // return Immutable.fromJS(state);
  } catch (err) {
    return undefined;
  }
};

export const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('clio_web_state', serializedState);
  } catch (err) {
    console.log(err);
    // Ignore write errors.
  }
};
