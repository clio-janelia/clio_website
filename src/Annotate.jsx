import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, shallowEqual } from 'react-redux';
import config from './config';

import './Neuroglancer.css';

import AnnotationPanel from './Annotation/AnnotationPanel';

// eslint-disable-next-line object-curly-newline
export default function Annotate({ children, actions, datasets, selectedDatasetName }) {
  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);
  const dataset = datasets.filter((ds) => ds.name === selectedDatasetName)[0];
  const projectUrl = useSelector((state) => state.clio.get('projectUrl'), shallowEqual);

  useEffect(() => {
    if (dataset && user) {
      const replaceRegex = new RegExp(`/${config.top_level_function}$`);
      const annotationsUrl = projectUrl.replace(replaceRegex, '');
      const layers = [
        {
          name: dataset.name,
          type: 'image',
          source: {
            url: `precomputed://${dataset.location}`,
          },
          tool: 'annotatePoint',
        },
        {
          name: 'annotations',
          type: 'annotation',
          source: {
            url: `clio://${annotationsUrl}/${dataset.name}?auth=neurohub`,
          },
          tool: 'annotatePoint',
        },
        {
          name: 'atlas',
          type: 'annotation',
          source: {
            url: `clio://${annotationsUrl}/${dataset.name}?auth=neurohub&kind=atlas`,
          },
          tool: 'annotatePoint',
        },
      ];

      if ('layers' in dataset) {
        dataset.layers.forEach((layer) => {
          layers.push({
            name: layer.name,
            type: layer.type,
            source: {
              url: `precomputed://${layer.location}`,
            },
          });
        });
      }

      const viewerOptions = {
        position: [],
        layers,
        selectedLayer: {
          layer: 'annotations',
        },
        layout: '4panel',
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
      }

      actions.initViewer(viewerOptions);
    }
  }, [user, actions, dataset, projectUrl]);

  if (dataset) {
    const annotationConfig = {
      layers: [
        {
          name: 'annotations',
          locateItem: actions.setViewerCameraPosition,
          dataConfig: {
            columns: [
              {
                title: 'Description',
                field: 'comment',
                filterEnabled: true,
              },
              {
                title: 'Position',
                field: 'pos',
              },
            ],
          },
        },
        {
          name: 'atlas',
          locateItem: actions.setViewerCameraPosition,
          dataConfig: {
            columns: [
              {
                title: 'Title',
                field: 'title',
                filterEnabled: true,
              },
              {
                title: 'Description',
                field: 'comment',
                filterEnabled: true,
              },
              {
                title: 'Position',
                field: 'pos',
              },
            ],
          },
        },
      ],
    };
    return (
      <div
        style={{ display: 'flex', height: '100%' }}
      >
        <div className="ng-container" style={{ flexGrow: 1 }}>
          {children}
        </div>
        <AnnotationPanel config={annotationConfig} actions={actions}>
          <div tabName="test">test</div>
        </AnnotationPanel>
      </div>
    );
  }
  return <div />;
}

Annotate.propTypes = {
  children: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  datasets: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedDatasetName: PropTypes.string.isRequired,
};
