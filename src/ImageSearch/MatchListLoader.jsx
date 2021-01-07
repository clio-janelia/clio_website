import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from 'react-query';

import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Pagination from '@material-ui/lab/Pagination';
import Skeleton from '@material-ui/lab/Skeleton';
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
  const queryClient = useQueryClient();

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const { mutate } = useMutation(
    () => {
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
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('savedSearches');
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
    },
  );

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

  if (isError) {
    return (
      <Grid item>
        <p>Load failed: {error.message}</p>
      </Grid>
    );
  }

  const pages = data ? Math.ceil(data.length / matchesPerPage) : 0;

  let matchesText = '';
  if (data && data.length > 0) {
    matchesText = `Matches ${currentPage * matchesPerPage - matchesPerPage + 1} - ${Math.min(
      currentPage * matchesPerPage,
      data.length,
    )} of ${data.length}`;
  }

  let paginatedList = [];

  if (data) {
    paginatedList = data.slice(
      currentPage * matchesPerPage - matchesPerPage,
      currentPage * matchesPerPage,
    );
  }

  let imageRootUrl = '';

  if (dataset) {
    imageRootUrl = config.imageSliceUrlTemplate.replace(
      '<location>',
      dataset.location.replace('gs://', ''),
    );
  }

  return (
    <>
      <Grid item xs={12} md={5}>
        <Typography>
          {isLoading ? (
            <Skeleton />
          ) : (
            <>
              Viewing Matches for <MouseCoordinates position={coords} />
            </>
          )}
          {isLoading ? (
            ''
          ) : (
            <Button variant="outlined" color="primary" onClick={handleSaveSearch}>
              Save
            </Button>
          )}
        </Typography>
      </Grid>
      <Grid item xs={12} md={2} className={classes.matchText}>
        <Typography>{isLoading ? <Skeleton /> : matchesText}</Typography>
      </Grid>
      <Grid item xs={12} md={5} className={classes.pagination}>
        {isLoading ? (
          <Skeleton />
        ) : (
          <Pagination count={pages} page={currentPage} onChange={handlePageChange} size="small" />
        )}
      </Grid>
      <Grid item xs={12}>
        <Matches
          matches={paginatedList}
          imageRootUrl={imageRootUrl}
          actions={actions}
          isLoading={isLoading}
        />
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
