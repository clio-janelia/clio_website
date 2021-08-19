import React from 'react';
import PropTypes from 'prop-types';
// import IconButton from '@material-ui/core/IconButton';
// import Tooltip from '@material-ui/core/Tooltip';
// import HighlightIcon from '@material-ui/icons/HighlightOutlined';
import DataFieldControl from '../DataTable/DataFieldControl';
import HighlightBodyControl from './HighlightBodyControl';
import {
  getSortedFieldArray,
  sortColumns,
  useStyles,
} from '../DataTable/DataTableUtils';

export default function BodyAnnotationTableControl({
  rows, columns, setColumns, showBodies,
}) {
  const classes = useStyles();

  const fieldControl = columns.shape ? (
    <DataFieldControl
      fields={getSortedFieldArray(columns)}
      selectedFields={columns.shape}
      onChange={(value) => {
        setColumns(sortColumns({
          ...columns,
          shape: value,
        }));
      }}
      fieldHint
    />
  ) : null;

  if (!fieldControl && !showBodies) {
    return null;
  }

  return (
    <div className={classes.controlRow}>
      {fieldControl}
      <HighlightBodyControl
        title="Highlight listed bodies in the viewer"
        showBodies={showBodies}
        getBodies={() => rows.map((row) => row.bodyid)}
      />
    </div>
  );
}

BodyAnnotationTableControl.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.object.isRequired,
  setColumns: PropTypes.func.isRequired,
  showBodies: PropTypes.func,
};

BodyAnnotationTableControl.defaultProps = {
  showBodies: null,
};
