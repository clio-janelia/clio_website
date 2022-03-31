import React from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useSelector, shallowEqual } from 'react-redux';
import { useMutation, useQueryClient } from 'react-query';

import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import IconButton from '@material-ui/core/IconButton';

import DeleteForeverIcon from '@material-ui/icons/DeleteForever';

import MouseCoordinates from './MouseCoordinates';
import config from '../config';
import { applyDatasetLocation } from '../utils/config';

import './Matches.css';

export default function SearchCard({ search, actions, dataset }) {
  const history = useHistory();
  const queryClient = useQueryClient();
  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);
  const clioUrl = useSelector((state) => state.clio.get('projectUrl'), shallowEqual);

  let imageRootUrl = '';

  if (dataset) {
    try {
      imageRootUrl = applyDatasetLocation(config.imageSliceUrlTemplate, dataset);
    } catch (err) {
      console.log(err);
    }
  }

  function handleSelect(point) {
    actions.setViewerCameraPosition(point);
    actions.setViewerCrossSectionScale(0.75);
    actions.setMousePosition(point);
    history.push('/ws/image_search');
  }

  const { mutate } = useMutation((point) => {
    const xyz = `x=${point[0]}&y=${point[1]}&z=${point[2]}`;
    const savedSearchUrl = `${clioUrl}/savedsearches/${dataset.key}?${xyz}`;
    const options = {
      method: 'Delete',
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    };
    return fetch(savedSearchUrl, options);
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries('savedSearches');
    },
  });

  const handleDelete = async (point) => {
    mutate(point);
  };

  const xyzString = `${Math.max(0, search.location[0] - 128)}_${Math.max(
    0,
    search.location[1] - 128,
  )}_${Math.max(0, search.location[2])}`;
  const imageUrl = imageRootUrl.replace('<xyz>', xyzString);
  const savedOn = new Date(search.timestamp * 1000);
  const savedOnFormatted = savedOn.toLocaleDateString('en-US');
  return (
    <Card raised>
      <CardActionArea onClick={() => handleSelect(search.location)}>
        <CardMedia
          component="img"
          alt="match thumbnail"
          height="256"
          image={imageUrl}
          title="match thumbnail"
        />
        <CardContent>
          <MouseCoordinates position={search.location} />
          <Typography variant="body1" component="p">
            Dataset:
            {search.dataset}
          </Typography>
          <Typography variant="body1" component="p">
            Saved on: {savedOnFormatted}
          </Typography>
          <Typography variant="body1" component="p">
            Note: {search.note}
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions>
        {actions && (
          <Button variant="outlined" color="primary" onClick={() => handleSelect(search.location)}>
            Show Matches
          </Button>
        )}
        <IconButton style={{ marginLeft: 'auto' }} onClick={() => handleDelete(search.location)}>
          <DeleteForeverIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}

SearchCard.propTypes = {
  actions: PropTypes.object.isRequired,
  dataset: PropTypes.object.isRequired,
  search: PropTypes.object.isRequired,
};
