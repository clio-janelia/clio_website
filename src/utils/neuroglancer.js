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

function getLayersFromDataset(dataset) {
  let layers = [];
  if (dataset.layers) {
    layers = dataset.layers;
  } else if (dataset.neuroglancer) {
    layers = dataset.neuroglancer.layers;
  }

  return layers;
}

function getLayerFromDataset(dataset, name) {
  const layers = getLayersFromDataset(dataset);
  return layers.find((layer) => layer.name === name);
}

function getLayerSourceUrl(layer) {
  let sourceUrl = layer.location || layer.source;
  // FIXME: we should expect explicit format info from the layer to determine the right format.
  // No such information is provided in the current database.
  if (sourceUrl && (sourceUrl.startsWith('gs://') || sourceUrl.startsWith('https://'))) {
    sourceUrl = `precomputed://${sourceUrl}`;
  }

  return sourceUrl;
}

function getMainImageLayer(dataset) {
  let newLayer = null;
  const layers = getLayersFromDataset(dataset);
  if (dataset.mainLayer) {
    const layer = layers.find((_layer) => _layer.name === dataset.mainLayer);
    if (layer) {
      newLayer = { ...layer };
    }
  }

  if (!newLayer) {
    const mainImageUrl = getLayerSourceUrl(dataset);
    const layer = layers.find((_layer) => getLayerSourceUrl(_layer) === mainImageUrl);
    newLayer = layer ? { ...layer } : { source: { url: mainImageUrl } };
  }

  if (newLayer) {
    newLayer.name = newLayer.name || dataset.key;
    if (!newLayer.source.url) {
      newLayer.source = {
        url: getLayerSourceUrl(newLayer),
      };
    }
  }

  return newLayer;
}

/* eslint-disable-next-line  import/prefer-default-export */
export function getDatasetLocation(dataset) {
  if ('location' in dataset) {
    return dataset.location;
  }

  if (dataset.mainLayer) {
    const layer = getLayerFromDataset(dataset);
    if (layer) {
      return layer.source;
    }
  }

  return '';
}

export function makeViewOptionsFromDataset(dataset, customOptions) {
  let dimensions = {
    x: [8e-9, 'm'],
    y: [8e-9, 'm'],
    z: [8e-9, 'm'],
  };
  if (dataset.dimensions) {
    dimensions = {
      // Make sure the order is in 'x', 'y', 'z'.
      // A different order can cause incorrect coordinate transform in Neuroglancer.
      x: dataset.dimensions.x,
      y: dataset.dimensions.y,
      z: dataset.dimensions.z,
      ...dataset.dimensions,
    };
  }
  return {
    dimensions,
    position: dataset.position || [],
    crossSectionScale: dataset.crossSectionScale || 2,
    projectionScale: dataset.projectionScale || 2600,
    projectionOrientation: [
      -0.2363949418067932,
      -0.28796303272247314,
      0.011459439061582088,
      0.927935004234314,
    ],
    layout: '4panel',
    showSlices: true,
    ...customOptions,
  };
}

export function makeLayersFromDataset(dataset, inferringType) {
  let layers = getLayersFromDataset(dataset);

  const mainImageLayer = getMainImageLayer(dataset);

  layers = layers.map((layer) => {
    const layerUrl = getLayerSourceUrl(layer);

    if (mainImageLayer && (layerUrl !== mainImageLayer.source.url)) {
      const layerConfig = {
        ...layer,
        source: {
          url: layerUrl,
        },
      };

      if (!layer.type && inferringType) {
        layerConfig.type = inferredLayerType(layer);
      }

      if (layerConfig.type === 'segmentation') {
        layerConfig.source.subsources = {
          skeletons: false,
        };
        layerConfig.source.enableDefaultSubsources = true;
      }

      return layerConfig;
    }

    return undefined;
  }).filter((layer) => layer);

  if (mainImageLayer) {
    layers = [
      mainImageLayer,
      ...layers,
    ];
  }

  return layers;
}

function mergeableLayerChecker(dataset) {
  let isMergeable = (layer) => {
    if (layer && layer.roles) {
      return layer.roles.includes('mergeable');
    }

    return false;
  };

  if (dataset.roles) { // roles moved out of layer in the new format
    isMergeable = (layer) => {
      const layerRoles = dataset.roles[layer.name];
      if (layerRoles) {
        return layerRoles.includes('mergeable');
      }
      return false;
    };
  }

  return isMergeable;
}

export function getMergeableLayerFromDataset(dataset) {
  return getLayersFromDataset(dataset).find(
    (layer) => mergeableLayerChecker(dataset)(layer),
  );
}

export function hasMergeableLayer(dataset) {
  return getLayersFromDataset(dataset).some(
    (layer) => mergeableLayerChecker(dataset)(layer),
  );
}

const defaultDvidService = 'https://ngsupport-bmcp5imp6q-uk.a.run.app';
const defaultLocateService = `${defaultDvidService}/locate-body`;

export function getLocateServiceUrl(sourceUrl, user) {
  if (sourceUrl) {
    const urlPattern = /^dvid:\/\/((http|https):\/\/[^/]+)\/([^/]+)\/([^/]+)(\?.*)?$/;
    const match = sourceUrl.match(urlPattern);
    if (match) {
      const baseUrl = match[1];
      const nodeKey = match[3];
      return `${defaultLocateService}?dvid=${baseUrl}&uuid=${nodeKey}&${(user ? `&u=${user}` : '')}`;
    }
  }

  return null;
}
