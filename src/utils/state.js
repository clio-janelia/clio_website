/* eslint-disable-next-line  import/prefer-default-export */
export function getLayerFromState(state, layerName) {
  if (layerName) {
    const layers = state.viewer.getIn(['ngState', 'layers']);
    const layer = layers.find((e) => (e.name === layerName));

    return layer;
  }

  return null;
}

export function getSelectedSegmentsFromState(state, layerName) {
  const layer = getLayerFromState(state, layerName);

  return layer && layer.segments;
}
