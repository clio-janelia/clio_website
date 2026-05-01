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

  it('loads persisted clio state as Immutable data', () => {
    saveState({ clio: { projectUrl: 'https://clio-dev.janelia.org:8080/v2' } });

    const state = loadState();

    expect(state.clio.get('projectUrl')).toBe('https://clio-dev.janelia.org:8080/v2');
  });

  it('normalizes old persisted production URLs to the configured clio-store base', () => {
    saveState({ clio: { projectUrl: 'https://emdata7.janelia.org/v2' } });

    const state = loadState();

    expect(state.clio.get('projectUrl')).toBe(defaultProjectUrl);
  });
});
