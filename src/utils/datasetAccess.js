export function canonicalDatasetName(datasets, selectedDatasetName) {
  if (!selectedDatasetName || !Array.isArray(datasets)) return null;
  const selectedDataset = datasets.find((dataset) => (
    dataset.name === selectedDatasetName || dataset.key === selectedDatasetName
  ));
  return selectedDataset && selectedDataset.key ? selectedDataset.key : null;
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

export async function checkDatasetAccess({ authBase, datasetKey, redirectUrl }) {
  if (!authBase || !datasetKey || !redirectUrl) return null;

  const baseUrl = authBase.charAt(authBase.length - 1) === '/'
    ? authBase
    : `${authBase}/`;
  const url = new URL('dataset-access', baseUrl);
  url.searchParams.set('dataset', datasetKey);
  url.searchParams.set('redirect', redirectUrl);

  try {
    const response = await fetch(url.toString(), { credentials: 'include' });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    return null;
  }
}

export function datasetAccessFingerprint(selectedDatasetName, datasetKey) {
  return `${selectedDatasetName || ''}\u0000${datasetKey || ''}`;
}

export function isCurrentDatasetAccessRequest(
  requestFingerprint,
  selectedDatasetName,
  datasetKey,
) {
  return requestFingerprint === datasetAccessFingerprint(selectedDatasetName, datasetKey);
}

export function tosLoopGuardKey(datasetKey) {
  return `clio-dsg-tos-redirect:${datasetKey}`;
}

export function readTosLoopGuard(datasetKey) {
  if (!datasetKey || typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(tosLoopGuardKey(datasetKey)) === '1';
}

export function setTosLoopGuard(datasetKey) {
  if (!datasetKey || typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(tosLoopGuardKey(datasetKey), '1');
}

export function clearTosLoopGuard(datasetKey) {
  if (!datasetKey || typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(tosLoopGuardKey(datasetKey));
}

export function datasetAccessGate({
  user,
  datasets,
  selectedDatasetName,
  checkResult,
  loopGuardState,
}) {
  const datasetKey = canonicalDatasetName(datasets, selectedDatasetName);
  if (!user || !datasetKey) {
    return { action: 'pass', datasetKey: null, loopGuard: 'keep' };
  }

  if (typeof checkResult === 'undefined') {
    return { action: 'query', datasetKey, loopGuard: 'keep' };
  }

  if (checkResult && checkResult.access) {
    return { action: 'pass', datasetKey, loopGuard: 'clear' };
  }

  if (checkResult && checkResult.tos_required && checkResult.tos_url) {
    if (loopGuardState) {
      return {
        action: 'show-card',
        datasetKey,
        tosUrl: checkResult.tos_url,
        loopGuard: 'keep',
      };
    }
    return {
      action: 'redirect',
      datasetKey,
      tosUrl: checkResult.tos_url,
      loopGuard: 'set',
    };
  }

  return { action: 'pass', datasetKey, loopGuard: 'keep' };
}
