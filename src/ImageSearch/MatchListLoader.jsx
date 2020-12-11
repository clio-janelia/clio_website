import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryCache } from 'react-query';

import Grid from '@material-ui/core/Grid';
import { Alert } from '@material-ui/lab';
import Button from '@material-ui/core/Button';
import Pagination from '@material-ui/lab/Pagination';
import { makeStyles } from '@material-ui/core/styles';

import Matches from './Matches';
import MouseCoordinates from './MouseCoordinates';
import { addAlert } from '../actions/alerts';
import config from '../config';

const useStyles = makeStyles({
  matchText: {
    textAlign: 'center',
  },
  pagination: {
    textAlign: 'right',
  },
});

const matchesPerPage = 8;

export default function MatchListLoader({
  user,
  dataset,
  coords,
  actions,
  clioUrl,
}) {
  const classes = useStyles();
  const [currentPage, setCurrentPage] = useState(1);
  const dispatch = useDispatch();
  const queryCache = useQueryCache();

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const [mutate] = useMutation(() => {
    const roundedPos = coords.map((point) => Math.floor(point));
    const xyz = `x=${roundedPos[0]}&y=${roundedPos[1]}&z=${roundedPos[2]}`;
    const savedSearchUrl = `${clioUrl}/savedsearches/${dataset.name}?${xyz}`;
    const body = { note: 'saved from clio image search' };
    const mutOptions = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.getAuthResponse().id_token}`,
      },
      body: JSON.stringify(body),
    };
    fetch(savedSearchUrl, mutOptions);
  }, {
    onSuccess: () => {
      queryCache.invalidateQueries('savedSearches');
      dispatch(
        addAlert({
          message: 'Search saved',
          severity: 'success',
          duration: 2000,
        }),
      );
    },
    onError: () => {
      dispatch(
        addAlert({
          message: 'Search save failed',
          duration: 3000,
        }),
      );
    },
  });

  const handleSaveSearch = () => {
    mutate();
  };

  const options = {
    headers: {
      Authorization: `Bearer ${user.getAuthResponse().id_token}`,
    },
  };
  const roundedPosition = coords.map((point) => Math.floor(point));
  const signaturesUrl = `${clioUrl}/signatures/likelocation/${dataset.name}?x=${
    roundedPosition[0]
  }&y=${roundedPosition[1]}&z=${roundedPosition[2]}`;

  const {
    isLoading,
    isError,
    data,
    error,
  } = useQuery(
    ['imgSearchMatches', dataset.name, coords.join('_')],
    () => fetch(signaturesUrl, options)
      .then((res) => res.json())
      .then((result) => {
        if (result.matches) {
          return result.matches;
        }
        return [];
      }),
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

  if (data.length === 0) {
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

  const pages = Math.ceil(data.length / matchesPerPage);

  let matchesText = '';
  if (data.length > 0) {
    matchesText = `Matches ${currentPage * matchesPerPage - matchesPerPage + 1} - ${Math.min(
      currentPage * matchesPerPage,
      data.length,
    )} of ${data.length}`;
  }

  const paginatedList = data.slice(
    currentPage * matchesPerPage - matchesPerPage,
    currentPage * matchesPerPage,
  );

  let imageRootUrl = '';

  if (dataset) {
    imageRootUrl = config.imageSliceUrlTemplate.replace(
      '<location>',
      dataset.location.replace('gs://', ''),
    );
  }

  return (
    <>
      {coords && coords.length > 0 && (
        <>
          <Grid item xs={12} md={4}>
            Viewing Matches for <MouseCoordinates position={coords} />
            <Button variant="outlined" color="primary" onClick={handleSaveSearch}>
              Save
            </Button>
          </Grid>
          <Grid item xs={12} md={4} className={classes.matchText}>
            {matchesText}
          </Grid>
          <Grid item xs={12} md={4} className={classes.pagination}>
            <Pagination count={pages} page={currentPage} onChange={handlePageChange} size="small" />
          </Grid>
        </>
      )}
      <Grid item xs={12}>
        <Matches matches={paginatedList} imageRootUrl={imageRootUrl} actions={actions} />
      </Grid>
    </>
  );
}

MatchListLoader.propTypes = {
  dataset: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  coords: PropTypes.arrayOf(PropTypes.number).isRequired,
  clioUrl: PropTypes.string.isRequired,
};
