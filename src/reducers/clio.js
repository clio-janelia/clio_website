import Immutable from 'immutable';
import C from './constants';
import config from '../config';

const clioUrl = `${config.projectBaseUrlDefault}/${
  config.top_level_function
}`;

const clioState = Immutable.Map({
  projectUrl: clioUrl,
});

export default function clioReducer(state = clioState, action) {
  switch (action.type) {
    case C.CLIO_SET_TOP_LEVEL_FUNC: {
      return state.set('projectUrl', action.url);
    }
    default: {
      return state;
    }
  }
}
