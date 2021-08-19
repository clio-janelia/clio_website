import React from 'react';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import HighlightIcon from '@material-ui/icons/HighlightOutlined';

export default function HighlightBodyControl({ title, showBodies, getBodies }) {
  if (!showBodies) {
    return null;
  }

  return (
    <Tooltip title={title}>
      <IconButton
        color="primary"
        onClick={() => showBodies(getBodies())}
      >
        <HighlightIcon />
      </IconButton>
    </Tooltip>
  );
}

HighlightBodyControl.propTypes = {
  title: PropTypes.string.isRequired,
  showBodies: PropTypes.func,
  getBodies: PropTypes.func.isRequired,
};

HighlightBodyControl.defaultProps = {
  showBodies: null,
};
