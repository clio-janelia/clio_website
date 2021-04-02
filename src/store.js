import { applyMiddleware, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';
import throttle from 'lodash/throttle';
import { loadState, saveState } from './utils/storage';
import rootReducer from './reducers';

function configureStore(preloadedState) {
  const middlewares = [thunk];
  const middlewareEnhancer = applyMiddleware(...middlewares);

  const enhancers = [middlewareEnhancer];
  const composedEnhancers = composeWithDevTools(...enhancers);

  const store = createStore(rootReducer, preloadedState, composedEnhancers);

  store.subscribe(throttle(() => {
    saveState({
      clio: store.getState().clio,
    });
  }, 1000));

  return store;
}

const persistedState = loadState();

const store = configureStore(persistedState);

export default store;
