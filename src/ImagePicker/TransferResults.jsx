import React, { useEffect, useState, useReducer } from 'react';
import PropTypes from 'prop-types';
import { useSelector, shallowEqual } from 'react-redux';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import MouseCoordinates from './MouseCoordinates';

const keyboardText = navigator.appVersion.indexOf('Mac') ? 'option' : 'alt';
const noMatches = (
  <div>
    <p>No matches found</p>
    <p>
      To locate matches use neuroglancer to navigate to a region of interest and
      <span className="kbd">{keyboardText}</span>+ &apos;click&apos; on the point you are interested
      in.
    </p>
  </div>
);

const imageSliceUrlTemplate = 'https://tensorslice-bmcp5imp6q-uk.a.run.app/slice/<xyz>/256_256_1/jpeg?location=<location>';

export default function TransferResults({
  mousePosition,
  dataset,
  projectUrl,
  model,
}) {
  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);
  const [isLoading, setIsLoading] = useState(0);
  const [resultLinks, dispatch] = useReducer((searchList, { type, value }) => {
    switch (type) {
      case 'init':
        return value;
      case 'add':
        return [...searchList, value];
      case 'remove':
        return searchList.filter((item) => item.id !== value);
      default:
        return searchList;
    }
  }, []);

  useEffect(() => {
    if (mousePosition && mousePosition.length > 0 && user && dataset && projectUrl) {
      const roundedPosition = mousePosition.map((point) => Math.floor(point));

      setIsLoading((i) => i + 1);

      const options = {
        headers: {
          Authorization: `Bearer ${user.getAuthResponse().id_token}`,
        },
        method: 'POST',
        body: JSON.stringify({
          dataset: dataset.name,
          model_name: model,
          center: roundedPosition,
        }),
      };

      const transferUrl = `${projectUrl}/transfer`;
      fetch(transferUrl, options)
        .then((resp) => resp.json())
        .then((result) => {
          if ('addr' in result) {
            const modifiedResult = {
              coordinates: roundedPosition,
              ...result,
            };
            dispatch({ type: 'add', value: modifiedResult });
          }
          setIsLoading((i) => i - 1);
        });
    }
  }, [dataset, mousePosition, projectUrl, user, model]);

  let imageRootUrl = '';

  if (dataset) {
    imageRootUrl = imageSliceUrlTemplate.replace(
      '<location>',
      dataset.location.replace('gs://', ''),
    );
  }

  const linksList = resultLinks.map((link) => {
    const { coordinates: coords } = link;
    const xyzString = `${coords[0] - 128}_${coords[1] - 128}_${coords[2]}`;
    const imageUrl = imageRootUrl.replace('<xyz>', xyzString);
    return (
      <Grid item xs={12} md={3} key={link.addr}>
        <Card raised>
          <CardActionArea
            href={link.addr}
            target="_blank"
            rel="noopener noreferrer"
          >
            <CardMedia
              component="img"
              alt="transfer preview"
              height="256"
              image={imageUrl}
              title="transfer preview"
            />
            <CardContent>
              <MouseCoordinates position={coords} />
            </CardContent>
          </CardActionArea>
          <CardActions>
            <Button
              variant="outlined"
              color="primary"
              href={link.addr}
              target="_blank"
              rel="noopener noreferrer"
            >
              View in Neuroglancer
            </Button>
          </CardActions>
        </Card>
      </Grid>
    );
  });

  const loadingList = [];
  for (let i = 0; i < isLoading; i += 1) {
    const loadingCard = (
      <Grid item xs={12} md={3} key={i}>
        <Card raised style={{ minHeight: '350px' }}>
          <CardContent style={{ textAlign: 'center', paddingTop: '150px' }}>
            <CircularProgress />
          </CardContent>
        </Card>
      </Grid>
    );
    loadingList.push(loadingCard);
  }

  return (
    <div>
      <Typography variant="h6">Transfer Results</Typography>
      {isLoading === 0 && linksList.length === 0 && noMatches}
      <Grid container spacing={3}>
        {loadingList}
        {linksList}
      </Grid>
    </div>
  );
}

TransferResults.propTypes = {
  mousePosition: PropTypes.arrayOf(PropTypes.number).isRequired,
  dataset: PropTypes.object.isRequired,
  projectUrl: PropTypes.string.isRequired,
  model: PropTypes.string.isRequired,
};
