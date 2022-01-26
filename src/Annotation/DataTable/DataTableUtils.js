import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles((theme) => (
  {
    dataTableRoot: {
      width: '100%',
      backgroundColor: 'white',
    },
    container: {
      maxHeight: '65vh',
    },
    tableRowIcon: {
      margin: 0,
      padding: '0px 6px 0px 6px',
    },
    toolColumn: {
      position: 'sticky',
      backgroundColor: '#fcfcfc',
      opacity: 0.9,
      left: 0,
      zIndex: 3,
    },
    headToolColumn: {
      position: 'sticky',
      backgroundColor: '#fcfcfc',
      opacity: 0.9,
      left: 0,
      zIndex: 5,
    },
    controlRow: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'left',
      minHeight: '0px',
      alignItems: 'center',
    },
    primaryLight: {
      backgroundColor: theme.palette.primary.light,
      width: '100%',
    },
  }
));

export const FIELD_PROP_TYPES = {
  field: PropTypes.string.isRequired,
  title: PropTypes.string,
  filterEnabled: PropTypes.bool,
  placeholder: PropTypes.string,
  jsonSchema: PropTypes.object,
  editElement: PropTypes.shape({
    type: PropTypes.string.isRequired,
  }),
  validate: PropTypes.func,
  normalize: PropTypes.func,
  rank: PropTypes.number,
};

export const DATA_TABLE_CONFIG_PROP_TYPES = {
  fields: PropTypes.objectOf(PropTypes.shape(FIELD_PROP_TYPES)).isRequired,
  shape: PropTypes.arrayOf(PropTypes.string),
  rank: PropTypes.arrayOf(PropTypes.string),
  primaryKey: PropTypes.string.isRequired,
};

export const COLUMNS_PROP_TYPES = PropTypes.oneOfType([
  PropTypes.arrayOf(PropTypes.shape(FIELD_PROP_TYPES)),
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
