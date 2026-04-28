import {
  buildTosRedirectUrl,
  canonicalDatasetName,
  getTosRedirectUrlForSelection,
  missingTosDatasetNames,
  selectedDatasetReturnUrl,
} from './dsgTos';

describe('DSG TOS helpers', () => {
  it('extracts missing TOS dataset names from the stored user profile', () => {
    const user = {
      info: {
        missing_tos: [
          { dataset_name: 'fanc', tos_id: 1 },
          { dataset_name: 'hemibrain', tos_id: 2 },
        ],
      },
    };

    expect(missingTosDatasetNames(user)).toEqual(new Set(['fanc', 'hemibrain']));
  });

  it('maps expanded Clio dataset names back to canonical DSG dataset IDs', () => {
    const datasets = [
      { name: 'fanc-v1', key: 'fanc' },
      { name: 'hemibrain', key: 'hemibrain' },
    ];

    expect(canonicalDatasetName(datasets, 'fanc-v1')).toBe('fanc');
    expect(canonicalDatasetName(datasets, 'hemibrain')).toBe('hemibrain');
    expect(canonicalDatasetName(datasets, 'unknown')).toBe('unknown');
  });

  it('preserves the selected Clio dataset in the service return URL', () => {
    expect(selectedDatasetReturnUrl(
      'https://clio.test/ws/review?tab=todo',
      'fanc-v1',
    )).toBe('https://clio.test/ws/review?tab=todo&dataset=fanc-v1');
  });

  it('builds the DSG service-check redirect URL', () => {
    const tosUrl = buildTosRedirectUrl(
      'https://dsg.test',
      'clio',
      'fanc',
      'https://clio.test/?dataset=fanc-v1',
    );

    expect(tosUrl).toBe(
      'https://dsg.test/web/tos/service-check/?service=clio&dataset=fanc&next=https%3A%2F%2Fclio.test%2F%3Fdataset%3Dfanc-v1',
    );
  });

  it('returns a redirect only when the selected dataset has missing TOS', () => {
    const user = {
      info: {
        dsg_url: 'https://dsg.test',
        missing_tos: [{ dataset_name: 'fanc', tos_id: 1 }],
      },
    };
    const datasets = [{ name: 'fanc-v1', key: 'fanc' }];

    const tosUrl = getTosRedirectUrlForSelection({
      user,
      datasets,
      selectedDatasetName: 'fanc-v1',
      currentUrl: 'https://clio.test/',
    });

    expect(tosUrl).toBe(
      'https://dsg.test/web/tos/service-check/?service=clio&dataset=fanc&next=https%3A%2F%2Fclio.test%2F%3Fdataset%3Dfanc-v1',
    );
    expect(getTosRedirectUrlForSelection({
      user,
      datasets,
      selectedDatasetName: 'open',
      currentUrl: 'https://clio.test/',
    })).toBeNull();
  });
});
