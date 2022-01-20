import C from '../reducers/constants';

export default function setToplevelUrl(url) {
  return {
    type: C.CLIO_SET_TOP_LEVEL_FUNC,
    url,
  };
}

export function resetTopLevelUrl() {
  return {
    type: C.CLIO_RESET_TOP_LEVEL_FUNC,
  };
}
