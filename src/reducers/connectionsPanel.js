import Immutable from 'immutable';
import C from './constants';

const connectionsPanelState = Immutable.Map({
  main: '',
  which: 'pre',
  data: { rows: [] },
});

export default function connectionsPanelReducer(state = connectionsPanelState, action) {
  switch (action.type) {
    case C.SET_CONNECTIONS_PANEL_MAIN: {
      return state.setIn(['main'], action.payload);
    }
    case C.SET_CONNECTIONS_PANEL_WHICH: {
      return state.setIn(['which'], action.payload);
    }
    case C.SET_CONNECTIONS_PANEL_DATA: {
      return state.setIn(['data'], action.payload);
    }
    default: {
      return state;
    }
  }
}
