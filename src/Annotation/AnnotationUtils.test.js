import { getBodyAnnotationColumnSetting } from './AnnotationUtils';

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
  })
});
