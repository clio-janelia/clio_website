function missingTosAppliesToService(item, service) {
  if (!service) return true;
  return !item.service || item.service === service;
}

export function missingTosDatasetNames(user, service = null) {
  const info = user && user.info ? user.info : {};
  const missingTos = Array.isArray(info.missing_tos) ? info.missing_tos : [];
  return missingTos.reduce((names, item) => {
    if (item && item.dataset_name && missingTosAppliesToService(item, service)) {
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
  return searchParams.get('dataset');
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

export function buildTosLoginRedirectUrl(authBaseUrl, dsgDataset, nextUrl) {
  if (!authBaseUrl || !dsgDataset || !nextUrl) return null;
  const baseUrl = authBaseUrl.charAt(authBaseUrl.length - 1) === '/'
    ? authBaseUrl
    : `${authBaseUrl}/`;
  const url = new URL('login', baseUrl);
  url.searchParams.set('redirect', nextUrl);
  url.searchParams.set('dataset', dsgDataset);
  return url.toString();
}

export function getTosRedirectUrlForSelection({
  user,
  datasets,
  selectedDatasetName,
  service = 'clio',
  currentUrl,
  authBaseUrl = null,
}) {
  const dsgDataset = canonicalDatasetName(datasets, selectedDatasetName);
  if (!dsgDataset || !missingTosDatasetNames(user, service).has(dsgDataset)) {
    return null;
  }

  const nextUrl = selectedDatasetReturnUrl(currentUrl, selectedDatasetName);
  if (authBaseUrl) {
    return buildTosLoginRedirectUrl(authBaseUrl, dsgDataset, nextUrl);
  }

  const dsgUrl = user && user.info ? user.info.dsg_url : null;
  return buildTosRedirectUrl(dsgUrl, service, dsgDataset, nextUrl);
}
