import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

const useStyles = makeStyles(() => (
  {
    controlRow: {
      display: 'flex',
      flexFlow: 'row',
      justifyContent: 'left',
      minHeight: '0px',
    },
  }
));

function BodyAnnotationQuery({
  defaultQueryString,
  onQueryChanged,
}) {
  const classes = useStyles();
  const [queryString, setQueryString] = useState(defaultQueryString);

  const submitQuery = () => {
    try {
      const newQuery = JSON.parse(queryString);
      if (newQuery) {
        onQueryChanged(newQuery);
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className={classes.controlRow}>
      <TextField
        label="Query"
        defaultValue={queryString}
        onKeyUp={(event) => {
          setQueryString(event.target.value);
        }}
        multiline
        rows={3}
        variant="outlined"
      />
      <Button
        color="primary"
        onClick={submitQuery}
      >
        Submit
      </Button>
    </div>
  );
}

BodyAnnotationQuery.propTypes = {
  defaultQueryString: PropTypes.string.isRequired,
  onQueryChanged: PropTypes.func.isRequired,
};

export default BodyAnnotationQuery;
