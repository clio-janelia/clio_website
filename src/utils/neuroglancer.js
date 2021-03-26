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
export function getLayerSourceUrl(layer) {
  let sourceUrl = layer.location || layer.source;
  // FIXME: we should expect explicit format info from the layer to determine the right format.
  // No such information is provided in the current database.
  if (sourceUrl && (sourceUrl.startsWith('gs://') || sourceUrl.startsWith('https://'))) {
    sourceUrl = `precomputed://${sourceUrl}`;
  }

  return sourceUrl;
}

function hasMainImageLayer(dataset) {
  if (dataset.layers) {
    const mainImageUrl = getLayerSourceUrl(dataset);
    return dataset.layers.some((layer) => getLayerSourceUrl(layer) === mainImageUrl);
  }

  return false;
}

export function makeLayersFromDataset(dataset, inferringType) {
  let layers = [];
  if ('layers' in dataset) {
    layers = dataset.layers.map((layer) => {
      const layerUrl = getLayerSourceUrl(layer);

      let { type } = layer;
      if (!type && inferringType) {
        type = inferredLayerType(layer);
      }

      const layerConfig = {
        name: layer.name,
        ...layer,
        source: {
          url: layerUrl,
        },
      };

      if (layerConfig.shader) {
        layerConfig.shader = layerConfig.shader.replaceAll('\\n', '\n');
      }

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

  if (!hasMainImageLayer(dataset)) {
    layers = [
      {
        name: dataset.name,
        type: 'image',
        source: {
          url: getLayerSourceUrl(dataset),
        },
      },
      ...layers,
    ];
  }

  return layers;
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
