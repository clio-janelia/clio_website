import React, { useState } from 'react';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import ViewIcon from '@material-ui/icons/VisibilityOutlined';
import HighlightIcon from '@material-ui/icons/HighlightOutlined';
import DataTable from '../DataTable/DataTable';
import DataFieldControl from '../DataTable/DataFieldControl';
import {
  getSortedFieldArray,
  sortColumns,
  useStyles,
} from '../DataTable/DataTableUtils';
// import { useLocalStorage } from '../utils/hooks';

function BodyAnnotationTable({ data, dataConfig, showBodies }) {
  const [columns, setColumns] = useState(dataConfig.columns);
  const classes = useStyles();

  const makeTableControl = React.useCallback(({ filteredRows }) => {
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

    let showBodyButton = null;
    if (showBodies) {
      showBodyButton = (
        <Tooltip title="Highlight listed bodies in the viewer">
          <IconButton
            color="primary"
            onClick={() => showBodies(filteredRows.map((row) => row.bodyid))}
          >
            <HighlightIcon />
          </IconButton>
        </Tooltip>
      );
    }

    if (!fieldControl && !showBodyButton) {
      return null;
    }

    return (
      <div className={classes.controlRow}>
        {fieldControl}
        {showBodyButton}
      </div>
    );
  }, [columns, classes, showBodies]);

  const makeCheckedSetControl = React.useCallback((checkedSet) => (
    showBodies ? (
      <Tooltip title="View checked bodies">
        <IconButton
          onClick={() => {
            if (checkedSet && checkedSet.size) {
              showBodies([...checkedSet]);
            }
          }}
        >
          <ViewIcon />
        </IconButton>
      </Tooltip>
    ) : null
  ), [showBodies]);

  return (
    <DataTable
      data={{ rows: data }}
      config={{ ...dataConfig, columns }}
      getId={React.useCallback((row) => row.bodyid, [])}
      makeTableControl={makeTableControl}
      makeCheckedSetControl={makeCheckedSetControl}
    />
  );
}

BodyAnnotationTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  dataConfig: PropTypes.object.isRequired,
  showBodies: PropTypes.func,
};

BodyAnnotationTable.defaultProps = {
  showBodies: null,
};

export default BodyAnnotationTable;
