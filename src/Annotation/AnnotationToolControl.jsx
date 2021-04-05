import React from 'react';
import PropTypes from 'prop-types';

import FormGroup from '@material-ui/core/FormGroup';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Tooltip from '@material-ui/core/Tooltip';

function AnnotationToolControl(props) {
  const { selectedTool, tools, onToolChanged } = props;

  const handleChange = (event) => {
    onToolChanged(event.target.value);
  };

  const buttons = tools.map((tool) => (
    <Tooltip key={tool.name} title={tool.tooltip}>
      <FormControlLabel value={tool.name} control={<Radio color="primary" />} label={tool.label} />
    </Tooltip>
  ));

  return (
    <FormControl component="fieldset">
      <FormLabel component="legend">Annotate (by Ctrl+Click in the viewer)</FormLabel>
      <FormGroup row>
        <RadioGroup row value={selectedTool} onChange={handleChange}>
          {buttons}
        </RadioGroup>
      </FormGroup>
    </FormControl>
  );
}

AnnotationToolControl.propTypes = {
  selectedTool: PropTypes.string,
  tools: PropTypes.arrayOf(PropTypes.object).isRequired,
  onToolChanged: PropTypes.func.isRequired,
};

AnnotationToolControl.defaultProps = {
  selectedTool: null,
};

export default AnnotationToolControl;
