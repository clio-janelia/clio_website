import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';

import Button from '@material-ui/core/Button';

import { addAlert } from './actions/alerts';

const inferredLayerType = (layer) => {
  if (layer.name.includes('segmentation')) {
    return 'segmentation';
  }
  if (layer.location.includes('segmentation')) {
    return 'segmentation';
  }
  return undefined;
};


export default function NapariButton({ dataset }) {
  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);
  const clioUrl = useSelector((state) => state.clio.get('projectUrl'), shallowEqual);
  const dispatch = useDispatch();

  let segmentationLayer = null;

  if (dataset && 'layers' in dataset) {
    dataset.layers.forEach((layer) => {
      if (inferredLayerType(layer) === 'segmentation') {
        segmentationLayer = layer.location;
      }
    });
  }

  const handleClick = () => {
    // eslint-disable-next-line no-underscore-dangle
    const coordinates = window.viewer.position.coordinates_;
    const body = {
      focus: coordinates,
      layer: segmentationLayer,
      grayscale: dataset.location,
    };

    const url = `${clioUrl}/subvol/${dataset.name}/edit`;
    const options = {
      headers: {
        Authorization: `Bearer ${user.getAuthResponse().id_token}`,
      },
      method: 'POST',
      body: JSON.stringify(body),
    };

    fetch(url, options)
      .then((response) => {
        if (response.status !== 200) {
          if (response.status === 403) {
            throw new Error('Not authorized.');
          }
          throw new Error('Server response failed');
        }
        return response.json();
      })
      .then(() => {
        // display message to say that editing can begin.
        dispatch(addAlert({ severity: 'success', message: `You can now use the Napari Clio plugin to edit your subvolume centered at (${coordinates[0]}, ${coordinates[1]}, ${coordinates[2]})` }));
      })
      .catch((err) => {
        dispatch(addAlert({ severity: 'error', message: `There was a problem contacting the clio storage service: ${err}` }));
      });
  };

  return (
    <Button onClick={handleClick}>
      Napari
    </Button>
  );
}

NapariButton.propTypes = {
  dataset: PropTypes.string.isRequired,
};
