import {
  canonicalDatasetName,
  checkDatasetAccess,
  clearTosLoopGuard,
  datasetAccessFingerprint,
  datasetAccessGate,
  isCurrentDatasetAccessRequest,
  readTosLoopGuard,
  selectedDatasetReturnUrl,
  setTosLoopGuard,
} from './datasetAccess';

const user = { info: { email: 'user@test.com' } };
const datasets = [{ name: 'fanc-v1', key: 'fanc:v1' }];

describe('dataset access helpers', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    sessionStorage.clear();
  });

  afterEach(() => {
    delete global.fetch;
    sessionStorage.clear();
  });

  it('requires a resolved dataset key rather than falling back to a display name', () => {
    expect(canonicalDatasetName(datasets, 'fanc-v1')).toBe('fanc:v1');
    expect(canonicalDatasetName(datasets, 'unknown')).toBeNull();
    expect(canonicalDatasetName(null, 'fanc-v1')).toBeNull();
  });

  it('preserves the selected display name in the browser return URL', () => {
    expect(selectedDatasetReturnUrl(
      'https://clio.test/ws/review?tab=todo',
      'fanc-v1',
    )).toBe('https://clio.test/ws/review?tab=todo&dataset=fanc-v1');
  });

  it('queries the store endpoint with credentials and an encoded redirect', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access: true, tos_required: false }),
    });

    await expect(checkDatasetAccess({
      authBase: 'https://backend.test/clio-store',
      datasetKey: 'fanc:v1',
      redirectUrl: 'https://clio.test/ws/review?dataset=fanc-v1',
    })).resolves.toEqual({ access: true, tos_required: false });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://backend.test/clio-store/dataset-access?dataset=fanc%3Av1&redirect=https%3A%2F%2Fclio.test%2Fws%2Freview%3Fdataset%3Dfanc-v1',
      { credentials: 'include' },
    );
  });

  it('fails open when the endpoint is unavailable or returns an error', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });
    await expect(checkDatasetAccess({
      authBase: 'https://backend.test', datasetKey: 'fanc:v1', redirectUrl: 'https://clio.test/',
    })).resolves.toBeNull();

    global.fetch.mockRejectedValueOnce(new Error('offline'));
    await expect(checkDatasetAccess({
      authBase: 'https://backend.test', datasetKey: 'fanc:v1', redirectUrl: 'https://clio.test/',
    })).resolves.toBeNull();
  });

  it('does not query before authentication, dataset load, or key resolution', () => {
    expect(datasetAccessGate({
      user: null, datasets, selectedDatasetName: 'fanc-v1', checkResult: undefined,
    }).action).toBe('pass');
    expect(datasetAccessGate({
      user, datasets: null, selectedDatasetName: 'fanc-v1', checkResult: undefined,
    }).action).toBe('pass');
    expect(datasetAccessGate({
      user, datasets, selectedDatasetName: 'unknown', checkResult: undefined,
    }).action).toBe('pass');
  });

  it('queries a resolved selected dataset with no completed check', () => {
    expect(datasetAccessGate({
      user, datasets, selectedDatasetName: 'fanc-v1', checkResult: undefined,
    })).toEqual({ action: 'query', datasetKey: 'fanc:v1', loopGuard: 'keep' });
  });

  it('redirects once for a pending TOS decision and then shows the fallback card', () => {
    const pending = {
      access: false,
      tos_required: true,
      tos_url: 'https://dsg.test/opaque-tos',
    };
    expect(datasetAccessGate({
      user, datasets, selectedDatasetName: 'fanc-v1', checkResult: pending, loopGuardState: false,
    })).toMatchObject({ action: 'redirect', loopGuard: 'set', tosUrl: pending.tos_url });
    expect(datasetAccessGate({
      user, datasets, selectedDatasetName: 'fanc-v1', checkResult: pending, loopGuardState: true,
    })).toMatchObject({ action: 'show-card', loopGuard: 'keep' });
  });

  it('clears the loop guard after access and on a selection switch', () => {
    setTosLoopGuard('fanc:v1');
    expect(readTosLoopGuard('fanc:v1')).toBe(true);
    expect(datasetAccessGate({
      user, datasets, selectedDatasetName: 'fanc-v1', checkResult: { access: true }, loopGuardState: true,
    })).toMatchObject({ action: 'pass', loopGuard: 'clear' });
    clearTosLoopGuard('fanc:v1');
    expect(readTosLoopGuard('fanc:v1')).toBe(false);
  });

  it('passes through denied or failed checks without client-side blocking', () => {
    expect(datasetAccessGate({
      user, datasets, selectedDatasetName: 'fanc-v1', checkResult: null,
    }).action).toBe('pass');
    expect(datasetAccessGate({
      user, datasets, selectedDatasetName: 'fanc-v1', checkResult: { access: false, tos_required: false },
    }).action).toBe('pass');
  });

  it('rejects stale results for a superseded selection', () => {
    const request = datasetAccessFingerprint('fanc-v1', 'fanc:v1');
    expect(isCurrentDatasetAccessRequest(request, 'fanc-v1', 'fanc:v1')).toBe(true);
    expect(isCurrentDatasetAccessRequest(request, 'other', 'other:v1')).toBe(false);
  });
});
