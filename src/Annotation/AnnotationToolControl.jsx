import React from 'react';
import PropTypes from 'prop-types';

import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';

const toolLabels = {
  annotatePoint: 'Point',
  annotateLine: 'Line',
};

function AnnotationToolControl(props) {
  const { defaultTool, tools, onToolChanged } = props;
  const [tool, setTool] = React.useState(defaultTool);

  const handleChange = (event) => {
    setTool(event.target.value);
    onToolChanged(event.target.value);
  };

  const buttons = tools.map((toolName) => (
    <FormControlLabel value={toolName} key={toolName} control={<Radio color="primary" />} label={toolLabels[toolName]} />
  ));

  return (
    <FormControl component="fieldset">
      <FormLabel component="legend">Annotate</FormLabel>
      <RadioGroup row value={tool} onChange={handleChange}>
        {buttons}
      </RadioGroup>
    </FormControl>
  );
}

AnnotationToolControl.propTypes = {
  defaultTool: PropTypes.string.isRequired,
  tools: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToolChanged: PropTypes.func.isRequired,
};

export default AnnotationToolControl;
