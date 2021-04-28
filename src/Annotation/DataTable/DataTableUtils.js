import PropTypes from 'prop-types';

export const COLUMNS_PROP_TYPES = PropTypes.oneOfType([
  PropTypes.arrayOf(PropTypes.shape({
    field: PropTypes.string,
    title: PropTypes.string,
    filterEnabled: PropTypes.bool,
  })),
  PropTypes.shape({
    shape: PropTypes.arrayOf(PropTypes.string),
    collection: PropTypes.object,
  }),
]);

/* eslint-disable-next-line  import/prefer-default-export */
export function getVisibleColumns(columns) {
  if (columns.shape) {
    return columns.shape.map((field) => ({
      ...columns.collection[field],
      field,
    }));
  }

  return columns;
}

export function getColumnSetting(columns, field) {
  if (columns.collection) {
    return columns.collection[field];
  }

  return columns.find((c) => c.field === field);
}

function compareField(collection) {
  return (field1, field2) => {
    const r1 = collection[field1].rank;
    const r2 = collection[field2].rank;
    if (r1 && r2) {
      return r1 - r2;
    }
    return -1;
  };
}

export function getSortedFieldArray(columns) {
  const { collection } = columns;
  if (collection) {
    return Object.keys(collection).map((key) => ({
      field: key,
      title: collection[key].title,
      rank: collection[key].rank,
    })).sort((c1, c2) => compareField(collection)(c1.field, c2.field));
  }

  return columns;
}

export function sortColumns(columns) {
  if (columns.shape) {
    const newColumns = {
      ...columns,
      shape: [...columns.shape],
    };
    newColumns.shape.sort(compareField(columns.collection));

    return newColumns;
  }

  return columns;
}

export function getColumnFields(columns) {
  if (columns.collection) {
    return Object.keys(sortColumns(columns).collection);
  }

  return columns.map((c) => c.field);
}
