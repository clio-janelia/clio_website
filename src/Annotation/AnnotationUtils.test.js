import {
  getBodyAnnotationColumnSetting,
  getAnnotationPos,
  getNewAnnotation,
} from './AnnotationUtils';

describe('get body annotation column setting', () => {
  it('should return null when the dataset is null or empty', () => {
    expect(getBodyAnnotationColumnSetting(null) === null);
    expect(getBodyAnnotationColumnSetting({}) === null);
  });

  it('should return the schema when the dataset specifies that', () => {
    const bodyAnnotationSchema = {
      shape: ['bodyid', 'type'],
    };
    expect(getBodyAnnotationColumnSetting({
      bodyAnnotationSchema,
    }).shape[0] === bodyAnnotationSchema.shape[0]);
  });

  it('should use key as default title', () => {
    const bodyAnnotationSchema = {
      collection: {
        bodyid: {
          filterEnabled: true,
        },
        class: {
          title: 'type',
        },
      },
    };
    expect(getBodyAnnotationColumnSetting({
      bodyAnnotationSchema,
    }).collection.bodyid.title === 'bodyid');
    expect(getBodyAnnotationColumnSetting({
      bodyAnnotationSchema,
    }).collection.class.title === 'type');
  });

  it('should integrate additional schema', () => {
    const bodyAnnotationSchema = {
      collection: {
        bodyid: {
          filterEnabled: true,
        },
        class: {
          title: 'type',
        },
      },
    };
    const columnsSetting = getBodyAnnotationColumnSetting({
      bodyAnnotationSchema,
      typing: {
        bodyAnnotation: {
          type: 'object',
          properties: {
            class: {
              type: 'string'
            },
            bodyid: {
              type: 'integer'
            },
          }
        }
      }
    });
    expect(columnsSetting.collection.bodyid.jsonSchema.type === 'integer');
    expect(columnsSetting.collection.class.jsonSchema.type === 'string');
  });
});

describe('get annotation position', () => {
  it ('should return point position', () => {
    expect(getAnnotationPos(
      {
        type: 0,
        point: [1, 2, 3],
      }
    )).toEqual([1, 2, 3]);
  });

  it ('should return line position', () => {
    expect(getAnnotationPos(
      {
        type: 1,
        pointA: [1, 2, 3],
        pointB: [11, 12, 13],
      }
    )).toEqual([6, 7, 8]);
  });

  it ('should return sphere position', () => {
    expect(getAnnotationPos(
      {
        type: 4,
        pointA: [1, 2, 3],
        pointB: [11, 12, 13],
      }
    )).toEqual([6, 7, 8]);
  });

  it ('should return null for unknow type', () => {
    expect(getAnnotationPos(
      {
        type: 5,
        pointA: [1, 2, 3],
        pointB: [11, 12, 13],
      }
    )).toBeNull();
  });
});

describe('get new annotation', () => {
  it('should stay the same with additional empty prop',() => {
    const annotation = {
      type: 1,
      point: [1, 2, 3],
    };
    expect(getNewAnnotation(annotation, {})).toStrictEqual({
      ...annotation,
      prop: {},
    });
  });

  it('should have new prop', () => {
    const annotation = {
      type: 1,
      point: [1, 2, 3],
    };
    const prop = { timestamp: 1 };
    expect(getNewAnnotation(annotation, prop)).toStrictEqual({
      ...annotation,
      prop,
    });
  });

  it('should process comment and title in new prop', () => {
    const annotation = {
      type: 1,
      point: [1, 2, 3],
      ext: {},
    };
    const prop = { timestamp: 1, comment: 'test', title: 'my title' };
    expect(getNewAnnotation(annotation, prop)).toStrictEqual({
      ...annotation,
      prop: {
        timestamp: 1,
      },
      ext: {
        description: prop.comment,
        title: prop.title,
      },
    });
  });

  it('should remove empty type prop', () => {
    const annotation = {
      type: 1,
      point: [1, 2, 3],
      ext: { type: 'ext type' },
      prop: { type: 'test' },
    };
    const prop = { type: '' };
    expect(getNewAnnotation(annotation, prop)).toStrictEqual({
      type: 1,
      point: [1, 2, 3],
      ext: { type: 'ext type' },
      prop: {},
    });
  });

  it('should remove false checked prop', () => {
    const annotation = {
      type: 1,
      point: [1, 2, 3],
      ext: { type: 'ext type' },
      prop: { checked: true },
    };
    const prop = { checked: false };
    expect(getNewAnnotation(annotation, prop)).toStrictEqual({
      type: 1,
      point: [1, 2, 3],
      ext: { type: 'ext type' },
      prop: {},
    });
  });
});

