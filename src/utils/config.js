import { getDatasetLocationWithoutProtocol } from './neuroglancer';

/* eslint-disable-next-line  import/prefer-default-export */
export function applyDatasetLocation(urlTemplate, dataset) {
  let location = dataset;
  if (typeof location !== 'string') {
    location = getDatasetLocationWithoutProtocol(dataset);
  }

  if (!location && urlTemplate.includes('<location>')) {
    throw Error('Cannot process the template because no location is found in the dataset.');
  }

  return urlTemplate.replace('<location>', location);
}

function makeDataset(baseDataset, version) {
  if (baseDataset && version) {
    const newDataset = {
      ...baseDataset,
      ...version,
      title: `${baseDataset.title}-${version.title}`,
      name: `${baseDataset.key}-${version.version}`,
    };

    if (version.neuroglancer) {
      newDataset.neuroglancer = {
        ...baseDataset.neuroglancer,
        ...version.neuroglancer,
      };
      const { layers } = version.neuroglancer;
      newDataset.neuroglancer.layers = [
        ...baseDataset.neuroglancer.layers,
        ...(layers || [])];
    }

    return newDataset;
  }

  return baseDataset;
}

function getBaseDataset(key, dataset) {
  return {
    ...dataset,
    key,
    name: key,
    title: dataset.title || key,
    versions: undefined,
  };
}

function expandDataset(key, dataset) {
  const baseDataset = getBaseDataset(key, dataset);

  if (dataset.versions) {
    return dataset.versions.map((version) => makeDataset(baseDataset, version));
  }

  return [baseDataset];
}

export function expandDatasets(datasets) {
  let expanded = [];
  Object.keys(datasets).forEach((key) => {
    expanded = [...expanded, ...expandDataset(key, datasets[key])];
  });
  return expanded;
}

export function getDataset(datasets, key, version) {
  const dataset = datasets[key];
  if (!dataset) {
    return null;
  }

  const baseDataset = getBaseDataset(key, dataset);
  baseDataset.name = version ? `${key}-${version}` : key;

  let versionObj = null;
  const { versions } = dataset;
  if (versions && versions.length > 0) {
    versionObj = version
      ? versions.find((v) => v.version === version)
      : versions[0];
  }

  return makeDataset(baseDataset, versionObj);
}
