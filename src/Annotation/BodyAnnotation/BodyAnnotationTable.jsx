import React, { useState } from 'react';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import ViewIcon from '@material-ui/icons/VisibilityOutlined';
import DataTable from '../DataTable/DataTable';
import BodyAnnotationTableControl from './BodyAnnotationTableControl';

function BodyAnnotationTable({ data, dataConfig, showBodies }) {
  const [columns, setColumns] = useState(dataConfig.columns);

  const makeTableControl = React.useCallback((rows) => (
    <BodyAnnotationTableControl
      rows={rows}
      columns={columns}
      showBodies={showBodies}
      setColumns={setColumns}
    />
  ), [columns, showBodies]);

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
