import React from 'react';
import PropTypes from 'prop-types';
import HighlightBodyControl from './HighlightBodyControl';
import BodyColorControl from './BodyColorControl';
import {
  useStyles,
} from '../DataTable/DataTableUtils';

export default function BodyListControl({
  getBodies, sourceString, highlightBodies, setBodyColor,
}) {
  const classes = useStyles();

  if (!highlightBodies && !setBodyColor) {
    return null;
  }

  return (
    <div className={classes.controlRow}>
      <HighlightBodyControl
        title={`Highlight ${sourceString} in the viewer`}
        getBodies={getBodies}
        showBodies={highlightBodies}
      />
      <BodyColorControl
        title={`Set color for ${sourceString}`}
        getBodies={getBodies}
        setBodyColor={setBodyColor}
      />
    </div>
  );
}

BodyListControl.propTypes = {
  getBodies: PropTypes.func.isRequired,
  sourceString: PropTypes.string.isRequired,
  highlightBodies: PropTypes.func,
  setBodyColor: PropTypes.func,
};

BodyListControl.defaultProps = {
  highlightBodies: null,
  setBodyColor: null,
};
