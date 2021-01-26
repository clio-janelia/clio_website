import { combineReducers } from 'redux';

import user from './user';
import viewer from './viewer';
import alerts from './alerts';
import clio from './clio';
import connectionsPanel from './connectionsPanel';

export default combineReducers({
  user,
  viewer,
  alerts,
  clio,
  connectionsPanel,
});
