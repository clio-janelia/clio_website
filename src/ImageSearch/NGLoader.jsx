import React, { useEffect } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  window: {
    width: '100%',
    margin: 'auto',
    height: '500px',
  },
});

export default function NGLoader({
  children,
  dataset,
  actions,
  coords,
}) {
  const projectUrl = useSelector((state) => state.clio.get('projectUrl'), shallowEqual);

  useEffect(() => {
    if (dataset) {
      let datasetUrl = dataset.location;
      if (!dataset.location.match(/^dvid/)) {
        datasetUrl = `precomputed://${dataset.location}`;
      }

      const layers = [
        {
          name: dataset.name,
          type: 'image',
          source: {
            url: datasetUrl,
          },
        },
        {
          name: 'annotations',
          type: 'annotation',
          source: {
            url: `clio://${projectUrl}/${dataset.name}?auth=neurohub`,
          },
        },
      ];

      if ('layers' in dataset) {
        dataset.layers.forEach((layer) => {
          let layerUrl = layer.location;
          if (!layer.location.match(/^dvid/)) {
            layerUrl = `precomputed://${layer.location}`;
          }
          layers.push({
            name: layer.name,
            type: layer.type,
            source: {
              url: layerUrl,
            },
          });
        });
      }

      const viewerOptions = {
        position: coords,
        crossSectionScale: 2,
        projectionScale: 2600,
        layers,
        layout: 'xy',
        showSlices: true,
      };

      // because the initViewer action makes some assumptions about the dimensions
      // of the dataset, we have to check for the mb20 dataset and change the
      // dimensions used. This should ideally be fixed in the initViewer action or
      // the dimensions should be passed as part of the dataset object from the clio
      // backend.
      if (dataset.name === 'mb20') {
        viewerOptions.dimensions = {
          x: [4e-9, 'm'],
          y: [4e-9, 'm'],
          z: [4e-9, 'm'],
        };
      } else {
        viewerOptions.dimensions = {
          x: [8e-9, 'm'],
          y: [8e-9, 'm'],
          z: [8e-9, 'm'],
        };
      }

      actions.initViewer(viewerOptions);
    }
  }, [actions, dataset, projectUrl, coords]);


  const classes = useStyles();
  return (
    <div className={classes.window} onContextMenu={(e) => e.preventDefault()}>
      {children}
    </div>
  );
}

NGLoader.propTypes = {
  actions: PropTypes.object.isRequired,
  children: PropTypes.arrayOf(PropTypes.object).isRequired,
  dataset: PropTypes.object.isRequired,
  coords: PropTypes.arrayOf(PropTypes.number).isRequired,
};
