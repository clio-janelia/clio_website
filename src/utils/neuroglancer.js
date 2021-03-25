// FIXME: Temporary hack for inferring the type of a layer without an explicit type.
function inferredLayerType(layer) {
  if (layer.name.includes('segmentation')) {
    return 'segmentation';
  }
  if (layer.location.includes('segmentation')) {
    return 'segmentation';
  }
  return undefined;
}

/* eslint-disable-next-line  import/prefer-default-export */
export function makeLayersFromDataset(dataset, inferringType) {
  if ('layers' in dataset) {
    return dataset.layers.map((layer) => {
      let layerUrl = layer.location;
      if (!layer.location.match(/^dvid/)) {
        layerUrl = `precomputed://${layer.location}`;
      }

      let { type } = layer;
      if (!type && inferringType) {
        type = inferredLayerType(layer);
      }

      const layerConfig = {
        name: layer.name,
        source: {
          url: layerUrl,
        },
        ...layer,
      };

      layerConfig.type = type;

      if (type === 'segmentation') {
        layerConfig.source.subsources = {
          skeletons: false,
        };
        layerConfig.source.enableDefaultSubsources = true;
      }

      return layerConfig;
    });
  }

  return [];
}

export function isMergeableLayer(layer) {
  if (layer && layer.roles) {
    return layer.roles.includes('mergeable');
  }

  return false;
}

export function hasMergeableLayer(dataset) {
  const { layers } = dataset;

  if (layers) {
    return layers.some((layer) => isMergeableLayer(layer));
  }

  return false;
}
