export function missingTosDatasetNames(user) {
  const info = user && user.info ? user.info : {};
  const missingTos = Array.isArray(info.missing_tos) ? info.missing_tos : [];
  return missingTos.reduce((names, item) => {
    if (item && item.dataset_name) {
      names.add(item.dataset_name);
    }
    return names;
  }, new Set());
}

export function canonicalDatasetName(datasets, selectedDatasetName) {
  if (!selectedDatasetName) return null;
  const selectedDataset = (datasets || []).find((dataset) => (
    dataset.name === selectedDatasetName || dataset.key === selectedDatasetName
  ));
  return selectedDataset && selectedDataset.key ? selectedDataset.key : selectedDatasetName;
}

export function selectedDatasetNameFromBrowser() {
  const searchParams = new URLSearchParams(window.location.search);
  const urlDataset = searchParams.get('dataset');
  if (urlDataset) return urlDataset;

  try {
    const storedDataset = localStorage.getItem('dataset');
    return storedDataset ? JSON.parse(storedDataset) : null;
  } catch (e) {
    return null;
  }
}

export function selectedDatasetReturnUrl(currentUrl, selectedDatasetName) {
  const url = new URL(currentUrl);
  if (selectedDatasetName) {
    url.searchParams.set('dataset', selectedDatasetName);
  } else {
    url.searchParams.delete('dataset');
  }
  return url.toString();
}

export function buildTosRedirectUrl(dsgUrl, service, dsgDataset, nextUrl) {
  if (!dsgUrl || !service || !dsgDataset || !nextUrl) return null;
  const url = new URL('/web/tos/service-check/', dsgUrl);
  url.searchParams.set('service', service);
  url.searchParams.set('dataset', dsgDataset);
  url.searchParams.set('next', nextUrl);
  return url.toString();
}

export function getTosRedirectUrlForSelection({
  user,
  datasets,
  selectedDatasetName,
  service = 'clio',
  currentUrl,
}) {
  const dsgDataset = canonicalDatasetName(datasets, selectedDatasetName);
  if (!dsgDataset || !missingTosDatasetNames(user).has(dsgDataset)) {
    return null;
  }

  const dsgUrl = user && user.info ? user.info.dsg_url : null;
  const nextUrl = selectedDatasetReturnUrl(currentUrl, selectedDatasetName);
  return buildTosRedirectUrl(dsgUrl, service, dsgDataset, nextUrl);
}
