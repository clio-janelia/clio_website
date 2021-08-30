import React from 'react';
import PropTypes from 'prop-types';
import DataFieldControl from '../DataTable/DataFieldControl';
import BodyListControl from './BodyListControl';
import {
  getSortedFieldArray,
  sortColumns,
  useStyles,
} from '../DataTable/DataTableUtils';

export default function BodyAnnotationTableControl({
  rows, columns, setColumns, showBodies, setBodyColor,
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

  const getBodies = React.useCallback(() => rows.map((row) => row.bodyid), [rows]);

  if (!fieldControl && !showBodies) {
    return null;
  }

  return (
    <div className={classes.controlRow}>
      {fieldControl}
      <BodyListControl
        sourceString="listed bodies"
        highlightBodies={showBodies}
        getBodies={getBodies}
        setBodyColor={setBodyColor}
      />
    </div>
  );
}

BodyAnnotationTableControl.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.object.isRequired,
  setColumns: PropTypes.func.isRequired,
  showBodies: PropTypes.func,
  setBodyColor: PropTypes.func,
};

BodyAnnotationTableControl.defaultProps = {
  showBodies: null,
  setBodyColor: null,
};
