import {
  getDatasetLocationWithoutProtocol,
  getLayerFromDataset,
  getLayerSourceUrl,
  isMergeableLayer,
  makeLayersFromDataset,
  getMergeableLayerFromDataset,
  hasMergeableLayer,
  parseDvidSource,
} from './neuroglancer';

describe('get layer from dataset', () => {
  it('should return null for null or empty dataset', () => {
    expect(getLayerFromDataset(null, 'test')).toBeNull();
    expect(getLayerFromDataset({}, 'test')).toBeNull();
  });

  it('should recognize layers at the top level', () => {
    const layer = getLayerFromDataset({
      layers: [{
        name: 'test',
      }],
    }, 'test');
    expect(layer.name).toBe('test');
  });

  it('should recongize the neuroglancer field', () => {
    const layer = getLayerFromDataset({
      neuroglancer: {
        layers: [{
          name: 'test',
        }],
      },
    }, 'test');
    expect(layer.name).toBe('test');
  });
});

describe('get source url of a layer', () => {
  it('should return null for a null or empty layer', () => {
    expect(getLayerSourceUrl(undefined)).toBe('');
    expect(getLayerSourceUrl(null)).toBe('');
    expect(getLayerSourceUrl({})).toBe('');
  });

  it('should return the right url', () => {
    expect(getLayerSourceUrl({
      location: 'dvid://https://test.com',
    })).toBe('dvid://https://test.com');
    expect(getLayerSourceUrl({
      source: 'dvid://https://test.com',
    })).toBe('dvid://https://test.com');
    expect(getLayerSourceUrl({
      source: {
        url: 'dvid://https://test.com',
      },
    })).toBe('dvid://https://test.com');
    expect(getLayerSourceUrl({
      location: 'gs://test.com',
    })).toBe('precomputed://gs://test.com');
  });
});

describe('get dataset location', () => {
  it('should return empty string if no location is found', () => {
    expect(getDatasetLocationWithoutProtocol(null)).toBe('');
    expect(getDatasetLocationWithoutProtocol({})).toBe('');
  });

  it ('should return the location url without protocol', () => {
    expect(getDatasetLocationWithoutProtocol({
      location: 'precomputed://gs://test.com'
    })).toBe('test.com');
    expect(getDatasetLocationWithoutProtocol({
      location: 'https://test.com'
    })).toBe('test.com');
    expect(getDatasetLocationWithoutProtocol({
      source: 'https://test.com'
    })).toBe('test.com');
    expect(getDatasetLocationWithoutProtocol({
      location: 'https://test.com'
    })).toBe('test.com');
    expect(getDatasetLocationWithoutProtocol({
      mainLayer: 'main',
      neuroglancer: {
        layers: [
          {
            name: 'main',
            source: {
              url: 'https://test.com',
            },
          }
        ],
      },
    })).toBe('test.com');
  });
});

describe('make layers from dataset', () => {
  it('should return empty array for dataset without layers', () => {
    expect(makeLayersFromDataset(null).length).toBe(0);
  });

  it('should return empty array for dataset without layers', () => {
    expect(makeLayersFromDataset({}).length).toBe(0);
  });

  it('should make the main image layer for dataset with location only', () => {
    const layers = makeLayersFromDataset({
      key: 'grayscale',
      location: 'gs://test.com',
    });
    expect(layers.length).toBe(1);
    expect(layers[0].source.url).toBe('precomputed://gs://test.com');
    expect(layers[0].name).toBe('grayscale');
  })

  it('should make all layers available', () => {
    const layers = makeLayersFromDataset({
      key: 'test',
      location: 'gs://test.com',
      layers: [
        {
          name: 'segmentation',
          source: 'https://seg.com',
        }
      ]
    });
    expect(layers.length).toBe(2);
    expect(layers[0].source.url).toBe('precomputed://gs://test.com');
    expect(layers[0].name).toBe('test');
    expect(layers[1].source).toBe('https://seg.com');
    expect(layers[1].name).toBe('segmentation');
  });

  it('should recognize the main image layer', () => {
    const layers = makeLayersFromDataset({
      key: 'test',
      mainLayer: 'grayscale',
      layers: [
        {
          name: 'grayscale',
          source: 'gs://test.com',
        },
        {
          name: 'segmentation',
          source: 'https://seg.com',
        }
      ]
    });
    expect(layers.length).toBe(2);
    expect(layers[0].source.url).toBe('precomputed://gs://test.com');
    expect(layers[0].name).toBe('grayscale');
    expect(layers[1].source).toBe('https://seg.com');
    expect(layers[1].name).toBe('segmentation');
  });

  it('should sort ordered layers', () => {
    const layers = makeLayersFromDataset({
      orderedLayers: ['segmentation', 'grayscale', 'nonexist'],
      key: 'test',
      mainLayer: 'grayscale',
      layers: [
        {
          name: 'grayscale',
          source: 'gs://test.com',
        },
        {
          name: 'annotation',
          source: 'https://annot.com',
        },
        {
          name: 'segmentation',
          source: 'https://seg.com',
        }
      ]
    });
    expect(layers.length).toBe(3);
    expect(layers[1].source.url).toBe('precomputed://gs://test.com');
    expect(layers[1].name).toBe('grayscale');
    expect(layers[0].source).toBe('https://seg.com');
    expect(layers[0].name).toBe('segmentation');
    expect(layers[2].source).toBe('https://annot.com');
    expect(layers[2].name).toBe('annotation');
  });
});

describe('detect mergeable layer', () => {
  it('should be mergeable layer', () => {
    expect(isMergeableLayer({
      roles: {
        segmentation: ['mergeable']
      }
    }, 'segmentation')).toBe(true);
  });

  it('should not be mergeable layer', () => {
    expect(isMergeableLayer({
      roles: {
        segmentation: ['not mergeable']
      }
    }, 'segmentation')).toBe(false);
  });

  it('should return the mergeable layer', () => {
    const dataset = {
      orderedLayers: ['segmentation', 'grayscale', 'nonexist'],
      key: 'test',
      mainLayer: 'grayscale',
      layers: [
        {
          name: 'grayscale',
          source: 'gs://test.com',
        },
        {
          name: 'annotation',
          source: 'https://annot.com',
        },
        {
          name: 'segmentation',
          source: 'https://seg.com',
        }
      ],
    };
    expect(hasMergeableLayer(dataset)).toBe(false);
    expect(getMergeableLayerFromDataset(dataset)).toBeUndefined();

    dataset.roles = {
      segmentation: ['mergeable'],
    };
    expect(hasMergeableLayer(dataset)).toBe(true);
    expect(getMergeableLayerFromDataset(dataset).name).toBe('segmentation');
  });
});

describe('dvid source', () => {
  it('should return null for invalid source', () => {
    expect(parseDvidSource('gs://test.com')).toBeNull();
  });

  it('should return parsed object', () => {
    expect(parseDvidSource('dvid://https://test.com:8080/1234/segmentation?p=1&q=2')).toStrictEqual({
      protocol: 'https',
      host: 'test.com:8080',
      uuid: '1234',
      dataInstance: 'segmentation',
      queryString: '?p=1&q=2',
    });

    expect(parseDvidSource('dvid://https://test.com:8080/1234/segmentation')).toStrictEqual({
      protocol: 'https',
      host: 'test.com:8080',
      uuid: '1234',
      dataInstance: 'segmentation',
      queryString: undefined,
    });
  })
})