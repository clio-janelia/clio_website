import React from 'react';
import PropTypes from 'prop-types';
import ReportProblemIcon from '@material-ui/icons/ReportProblem';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';

export default function DataCell({
  column, value, onErrorClick, localize,
}) {
  if (column.validate) {
    let errorHint = '';
    if (!column.validate(value, (error) => {
      errorHint = error;
    })) {
      return (
        <Tooltip title={errorHint} style={{ color: 'orange' }}>
          <IconButton onClick={onErrorClick}>
            <ReportProblemIcon />
          </IconButton>
        </Tooltip>
      );
    }
  }

  if (value === null || value === undefined) {
    return null;
  }

  let child = value;

  if (typeof value === 'boolean') {
    child = value ? 'Y' : 'N';
  }

  if (Array.isArray(value)) {
    child = value.join(', ');
  }

  if (column.editElement && localize) {
    if (column.editElement.type === 'point') {
      return (
        <span style={{ cursor: 'pointer' }} onClick={() => localize(value)} onKeyDown={() => {}}>
          {child}
        </span>
      );
    }
  }

  return (
    <span>
      {child}
    </span>
  );
}

DataCell.propTypes = {
  column: PropTypes.object.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
    PropTypes.array,
  ]),
  onErrorClick: PropTypes.func.isRequired,
  localize: PropTypes.func,
};

DataCell.defaultProps = {
  value: undefined,
  localize: null,
};
