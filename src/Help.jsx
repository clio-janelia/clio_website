import React from 'react';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  root: {
    margin: '1em',
  },
});

export default function Help() {
  const classes = useStyles();
  return (
    <Grid container spacing={3} className={classes.root}>
      <Grid item sm={8}>
        <Typography variant="h2">Help</Typography>
      </Grid>
      <Grid item sm={4}>
        <Typography variant="h6">
          v{process.env.REACT_APP_VERSION} - {process.env.NODE_ENV}
        </Typography>
      </Grid>
      <Grid item sm={12}>
        <Typography variant="h6">Help contents</Typography>
      </Grid>
    </Grid>
  );
}
