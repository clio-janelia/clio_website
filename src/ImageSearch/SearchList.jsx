import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from 'react-query';
import Grid from '@material-ui/core/Grid';
import { Alert } from '@material-ui/lab';
import SearchCard from './SearchCard';

export default function SearchList({
  user,
  dataset,
  clioUrl,
  actions,
}) {
  const savedSearchesUrl = `${clioUrl}/savedsearches/${dataset.name}`; // dataset
  const options = {
    headers: {
      Authorization: `Bearer ${user.getAuthResponse().id_token}`,
    },
  };

  const {
    isLoading,
    isError,
    data,
    error,
  } = useQuery(
    ['savedSearches', dataset.name],
    () => fetch(savedSearchesUrl, options).then((response) => response.json()),
    { staleTime: 30000 },
  );

  if (isLoading) {
    return (
      <Grid item>
        <p>Loading...</p>
      </Grid>
    );
  }

  if (isError) {
    return (
      <Grid item>
        <p>Load failed: {error.message}</p>
      </Grid>
    );
  }

  if (Object.values(data).length === 0) {
    return (
      <Grid item style={{ margin: '0 auto' }}>
        <Alert severity="info">
          <p>
            No Saved searches found for this dataset. To add some searches to this list, Please go
            back to the main ImageSearch page and add them there.
          </p>
        </Alert>
      </Grid>
    );
  }

  // - display them as a list of thumbnail cards with a link to show the
  // coordinates in the main view with the attached results.
  return Object.values(data).map((search) => (
    <Grid key={search.location} item sm={3}>
      <SearchCard search={search} dataset={dataset} actions={actions} />
    </Grid>
  ));
}

SearchList.propTypes = {
  dataset: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  clioUrl: PropTypes.string.isRequired,
};
