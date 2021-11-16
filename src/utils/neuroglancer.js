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
  if (dataset) {
    if (dataset.layers) {
      layers = dataset.layers;
    } else if (dataset.neuroglancer) {
      layers = dataset.neuroglancer.layers;
    }
  }

  return layers || [];
}

export function getLayerFromDataset(dataset, name) {
  const layers = getLayersFromDataset(dataset);
  return layers.find((layer) => layer.name === name) || null;
}

export function getLayerSourceUrl(layer) {
  if (!layer) {
    return '';
  }

  let sourceUrl = layer.location || layer.source;
  if (sourceUrl && sourceUrl.url) {
    sourceUrl = sourceUrl.url;
  }

  // FIXME: we should expect explicit format info from the layer to determine the right format.
  // No such information is provided in the current database.
  if (sourceUrl && (sourceUrl.startsWith('gs://') || sourceUrl.startsWith('https://'))) {
    sourceUrl = `precomputed://${sourceUrl}`;
  }

  return sourceUrl || '';
}

function getMainImageLayer(dataset) {
  let newLayer = null;
  if (dataset) {
    const layers = getLayersFromDataset(dataset);
    if (dataset.mainLayer) {
      const layer = layers.find((_layer) => _layer.name === dataset.mainLayer);
      if (layer) {
        newLayer = { ...layer };
      }
    }

    if (!newLayer) {
      const mainImageUrl = getLayerSourceUrl(dataset);
      if (mainImageUrl) {
        const layer = layers.find((_layer) => getLayerSourceUrl(_layer) === mainImageUrl);
        newLayer = layer ? { ...layer } : { source: { url: mainImageUrl } };
      }
    }

    if (newLayer) {
      newLayer.name = newLayer.name || dataset.key;
      if (!newLayer.source.url) {
        newLayer.source = {
          url: getLayerSourceUrl(newLayer),
        };
      }
    }
  }

  return newLayer;
}

/* eslint-disable-next-line  import/prefer-default-export */
export function getDatasetLocationWithoutProtocol(dataset) {
  let location = '';
  if (dataset) {
    if ('location' in dataset || 'source' in dataset) {
      location = dataset.location || dataset.source;
    } else if (dataset.mainLayer) {
      location = getLayerSourceUrl(getMainImageLayer(dataset));
    }
    const matched = location.match(/(.*):\/\/(.*)/);
    if (matched) {
      /* eslint-disable-next-line prefer-destructuring */
      location = matched[2];
    }
  }

  return location;
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

  const predefined = { ...(dataset.neuroglancer || {}) };
  delete predefined.layers;
  delete predefined.selectedLayer;

  return {
    title: dataset.name,
    showSlices: true, // Show slices in the 3D view by default
    ...predefined,
    dimensions,
    position: predefined.position || dataset.position || [],
    crossSectionScale: predefined.crossSectionScale || null,
    projectionScale: predefined.projectionScale || null,
    projectionOrientation: predefined.projectionOrientation || [
      -0.2363949418067932,
      -0.28796303272247314,
      0.011459439061582088,
      0.927935004234314,
    ],
    crossSectionOrientation: predefined.crossSectionOrientation || null,
    layout: '4panel',
    ...customOptions,
  };
}

export function makeLayersFromDataset(dataset, inferringType) {
  let layers = getLayersFromDataset(dataset);

  const mainImageLayer = getMainImageLayer(dataset);

  layers = layers.map((layer) => {
    const layerUrl = getLayerSourceUrl(layer);

    if (layerUrl && layerUrl !== (mainImageLayer && mainImageLayer.source.url)) {
      const layerConfig = { ...layer };
      if (!layer.type && inferringType) {
        layerConfig.type = inferredLayerType(layer);
      }

      if (layerConfig.type === 'segmentation' && typeof (layerConfig.source || '') === 'string') {
        layerConfig.source = {
          url: layerUrl,
          subsources: {
            default: true,
            mesh: true,
          },
          enableDefaultSubsources: false,
        };
        delete layerConfig.location;
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

  if (layers.length > 0) {
    const { orderedLayers } = dataset;
    if (orderedLayers && orderedLayers.length > 0) {
      const ranks = {};
      layers.forEach((layer, index) => {
        ranks[layer.name] = index + layers.length;
      });
      orderedLayers.forEach((layerName, index) => {
        ranks[layerName] = index;
      });

      layers.sort((layer1, layer2) => ranks[layer1.name] - ranks[layer2.name]);
    }
  }

  return layers;
}

function hasMergeableRole(roles) {
  return roles && roles.includes('mergeable');
}

export function isMergeableLayer(dataset, layerName) {
  if (dataset.roles) {
    const layerRoles = dataset.roles[layerName];
    if (layerRoles) {
      return hasMergeableRole(layerRoles);
    }

    return false;
  }

  const layer = getLayerFromDataset(dataset, layerName);

  return hasMergeableRole(layer.roles);
}

function mergeableLayerChecker(dataset) {
  let isMergeable = (layer) => {
    if (layer && layer.roles) {
      return hasMergeableRole(layer.roles);
    }

    return false;
  };

  if (dataset.roles) { // roles moved out of layer in the new format
    isMergeable = (layer) => hasMergeableRole(dataset.roles[layer.name]);
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

export function parseDvidSource(sourceUrl) {
  if (sourceUrl) {
    // dvid://https://<base>/<uuid>/<data name>?<query string>
    const urlPattern = /^dvid:\/\/(http|https):\/\/([^/]+)\/([^/]+)\/([^/?]+)(\?.*)?$/;
    const match = sourceUrl.match(urlPattern);
    if (match) {
      return {
        protocol: match[1],
        host: match[2],
        uuid: match[3],
        dataInstance: match[4],
        queryString: match[5],
      };
    }
  }

  return null;
}

export function getLocateServiceUrl(sourceUrl, user) {
  if (sourceUrl) {
    const dvidConfig = parseDvidSource(sourceUrl);
    if (dvidConfig) {
      return `${defaultLocateService}?dvid=${dvidConfig.protocol}://${dvidConfig.host}&uuid=${dvidConfig.uuid}&${(user ? `&u=${user}` : '')}`;
    }
  }

  return null;
}

export function saveViewerState(name, state) {
  window.sessionStorage.setItem(name, JSON.stringify(state));
}

export function retrieveViewerState(name) {
  const stateStr = window.sessionStorage.getItem(name);
  if (stateStr) {
    try {
      const state = JSON.parse(stateStr);
      if (state.crossSectionOrientation === undefined) {
        // Make sure crossSectionOrientation is defined to override the previous value
        state.crossSectionOrientation = null;
      }
      return state;
    } catch (_) {
      return null;
    }
  }

  return null;
}
