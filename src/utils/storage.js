import Immutable from 'immutable';

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
    const serializedState = localStorage.getItem('clio_state');
    if (serializedState === null) {
      return undefined;
    }
    const state = JSON.parse(serializedState);
    console.log(state);
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
    localStorage.setItem('clio_state', serializedState);
  } catch (err) {
    console.log(err);
    // Ignore write errors.
  }
};
