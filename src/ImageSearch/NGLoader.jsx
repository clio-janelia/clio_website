import React, { useEffect } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import {
  makeLayersFromDataset,
  makeViewOptionsFromDataset,
} from '../utils/neuroglancer';

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
      const layers = [
        ...makeLayersFromDataset(dataset, false),
        {
          name: 'annotations',
          type: 'annotation',
          source: {
            url: `clio://${projectUrl}/${dataset.name}?auth=neurohub`,
          },
        },
      ];

      const viewerOptions = makeViewOptionsFromDataset(
        dataset,
        {
          position: coords,
          layers,
          layout: 'xy',
        },
      );
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
