import React from 'react';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import './MouseCoordinates.css';

export default function MouseCoordinates({ position }) {
  if (!position || position.length < 3) {
    return '';
  }
  return (
    <div className="mousecoordinates">
      <Typography variant="body1" component="p">
        x:
        {Math.floor(position[0])}
      </Typography>
      <Typography variant="body1" component="p">
        y:
        {Math.floor(position[1])}
      </Typography>
      <Typography variant="body1" component="p">
        z:
        {Math.floor(position[2])}
      </Typography>
    </div>
  );
}

MouseCoordinates.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
};
