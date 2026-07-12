import config from '../config';
import { loadState, saveState } from './storage';

const defaultProjectUrl = `${config.projectBaseUrlDefault}/${config.top_level_function}`;

describe('storage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('loads a current (non-legacy) persisted clio state unchanged as Immutable data', () => {
    saveState({ clio: { projectUrl: 'https://clio-store-staging.example.com/v2' } });

    const state = loadState();

    expect(state.clio.get('projectUrl')).toBe('https://clio-store-staging.example.com/v2');
  });

  it('migrates persisted URLs for retired backends to the configured default', () => {
    [
      'https://emdata7.janelia.org/v2',
      'https://emdata7.janelia.org/clio-store/v2',
      'https://clio-dev.janelia.org:8080/v2',
      'https://clio-store-dsg-464281314980.us-east4.run.app/v2',
    ].forEach((deadUrl) => {
      localStorage.clear();
      saveState({ clio: { projectUrl: deadUrl } });

      expect(loadState().clio.get('projectUrl')).toBe(defaultProjectUrl);
    });
  });
});
