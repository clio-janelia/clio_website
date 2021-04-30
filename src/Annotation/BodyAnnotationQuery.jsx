import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

const useStyles = makeStyles(() => (
  {
    controlRow: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'left',
      minHeight: '0px',
      alignItems: 'center',
    },
  }
));

function BodyAnnotationQuery({
  defaultQueryString,
  onQueryChanged,
  loading,
  getSelectedSegments,
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
        value={queryString}
        onChange={(event) => {
          setQueryString(event.target.value);
        }}
        multiline
        rows={3}
        style={{ width: '50%' }}
        variant="outlined"
      />
      <Button
        color="primary"
        onClick={submitQuery}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Submit'}
      </Button>
      <Button
        color="primary"
        variant="contained"
        disabled={loading}
        style={{ height: 'fit-content' }}
        onClick={
          () => {
            const segments = getSelectedSegments();
            const query = { bodyid: segments };
            setQueryString(JSON.stringify(query));
            if (segments.length > 0) {
              onQueryChanged(query);
            }
          }
        }
      >
        Selected Segments
      </Button>
    </div>
  );
}

BodyAnnotationQuery.propTypes = {
  defaultQueryString: PropTypes.string.isRequired,
  onQueryChanged: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  getSelectedSegments: PropTypes.func.isRequired,
};

export default BodyAnnotationQuery;
