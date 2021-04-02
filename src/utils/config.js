import { getDatasetLocation } from './neuroglancer';

/* eslint-disable-next-line  import/prefer-default-export */
export function applyDatasetLocation(urlTemplate, dataset) {
  return urlTemplate.replace('<location>', getDatasetLocation(dataset).replace('gs://', ''));
}
