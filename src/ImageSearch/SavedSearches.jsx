import React from 'react';
import PropTypes from 'prop-types';
import { useSelector, shallowEqual } from 'react-redux';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import SearchList from './SearchList';

export default function SavedSearches({ dataset, actions }) {
  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);
  const clioUrl = useSelector((state) => state.clio.get('projectUrl'), shallowEqual);

  return (
    <div style={{ margin: '1em' }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h5">Saved Searches</Typography>
        </Grid>
        {user && dataset && clioUrl && (
          <SearchList actions={actions} user={user} dataset={dataset} clioUrl={clioUrl} />
        )}
      </Grid>
    </div>
  );
}

SavedSearches.propTypes = {
  dataset: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
};
