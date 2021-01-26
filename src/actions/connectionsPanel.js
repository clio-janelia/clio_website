import C from '../reducers/constants';

export function setConnectionsPanelMain(payload) {
  return {
    type: C.SET_CONNECTIONS_PANEL_MAIN,
    payload,
  };
}

export function setConnectionsPanelWhich(payload) {
  return {
    type: C.SET_CONNECTIONS_PANEL_WHICH,
    payload,
  };
}

export function setConnectionsPanelData(payload) {
  return {
    type: C.SET_CONNECTIONS_PANEL_DATA,
    payload,
  };
}
