import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import {
  useStyles,
} from '../DataTable/DataTableUtils';

export default function BodyViewControl({
  resetBodySelection,
  resetBodyColor,
}) {
  const classes = useStyles();

  return (
    <div className={classes.primaryLight}>
      <div className={classes.controlRow} style={{ padding: '10px' }}>
        <Button
          color="primary"
          variant="contained"
          onClick={resetBodySelection}
        >
          Clear Highlight
        </Button>
        <Button
          color="primary"
          variant="contained"
          style={{ marginLeft: '5px' }}
          onClick={resetBodyColor}
        >
          Reset Color
        </Button>
      </div>
    </div>
  );
}

BodyViewControl.propTypes = {
  resetBodySelection: PropTypes.func.isRequired,
  resetBodyColor: PropTypes.func.isRequired,
};
