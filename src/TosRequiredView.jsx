import React from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  root: {
    width: '600px',
    maxWidth: '90%',
    margin: '4em auto',
    textAlign: 'center',
  },
  actions: {
    justifyContent: 'center',
    paddingBottom: '1.5em',
  },
});

export default function TosRequiredView({ datasetName, onAccept }) {
  const classes = useStyles();
  return (
    <Card className={classes.root}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Terms of Service Required
        </Typography>
        <Typography>
          The dataset <strong>{datasetName}</strong> requires you to accept its
          Terms of Service before you can view it.
        </Typography>
      </CardContent>
      <CardActions classes={{ root: classes.actions }}>
        <Button variant="contained" color="primary" onClick={onAccept}>
          Accept Terms of Service
        </Button>
      </CardActions>
    </Card>
  );
}

TosRequiredView.propTypes = {
  datasetName: PropTypes.string.isRequired,
  onAccept: PropTypes.func.isRequired,
};
