import React from 'react';
import PropTypes from 'prop-types';
import { useSelector, shallowEqual } from 'react-redux';

import Button from '@material-ui/core/Button';

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

  let segmentationLayer = null;

  if (dataset && 'layers' in dataset) {
    dataset.layers.forEach((layer) => {
      if (inferredLayerType(layer) === 'segmentation') {
        segmentationLayer = layer.location;
      }
    });
  }

  const handleClick = () => {
    const body = {
      // eslint-disable-next-line no-underscore-dangle
      focus: window.viewer.position.coordinates_,
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
      .then((data) => {
        console.log(data);
        // display message to say that editing can begin.
      })
      .catch((err) => {
        console.log(err);
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
