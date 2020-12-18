import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, shallowEqual } from 'react-redux';
import { getNeuroglancerColor } from '@janelia-flyem/react-neuroglancer';
import activeElementNeedsKeypress from './utils/events';
import AnnotationPanel from './Annotation/AnnotationPanel';
import config from './config';
import MergeBackendLocal from './Annotation/MergeBackendLocal';
import MergeManager from './Annotation/MergeManager';
import { MergePanel, onKeyPressMerge, onVisibleChangedMerge } from './Annotation/MergePanel';

import './Neuroglancer.css';

const inferredLayerType = (layer) => {
  if (layer.name.includes('segmentation')) {
    return 'segmentation';
  }
  if (layer.location.includes('segmentation')) {
    return 'segmentation';
  }
  return undefined;
};

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
            type: layer.type || inferredLayerType(layer),
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
      // Because the initViewer action makes some assumptions about the dimensions
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

  const mergeManager = React.useRef(new MergeManager());
  useEffect(() => {
    if (dataset && user) {
      // TODO: Switch to backend using cloud storage.
      const backend = new MergeBackendLocal();
      mergeManager.current.init(actions, getNeuroglancerColor, backend);
    }
  }, [actions, dataset, mergeManager, user]);

  const onKeyPress = (event) => {
    // Ignore keyboard shortcuts when a Neuroglancer text input has focus.
    if (activeElementNeedsKeypress()) {
      return;
    }
    onKeyPressMerge(event, mergeManager.current);
  };

  // Neuroglancer's notion of "visible" corresponds to other applications' notion of "selected".
  const onVisibleChanged = (segments, layer) => {
    onVisibleChangedMerge(segments, layer, mergeManager.current);
  };

  // Add `onVisibleChanged` to the props of the child, which is a react-neuroglancer viewer.
  const childrenWithMoreProps = React.Children.map(children, (child) => (
    React.cloneElement(child, { onVisibleChanged }, null)
  ));

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
                editElement: {
                  type: 'input',
                },
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
                placeholder: '*Required',
                editElement: {
                  type: 'input',
                },
                checkValidity: (value, handleError) => {
                  const isValid = value && value.trim();
                  if (handleError && !isValid) {
                    handleError('The title field of atlas cannot be empty. It will NOT be saved until a valid title is specified.');
                  }
                  return isValid;
                },
              },
              {
                title: 'Description',
                field: 'comment',
                filterEnabled: true,
                editElement: {
                  type: 'input',
                },
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
        <div
          className="ng-container"
          style={{ flexGrow: 1 }}
          tabIndex={0}
          onKeyPress={onKeyPress}
        >
          {childrenWithMoreProps}
        </div>
        <AnnotationPanel config={annotationConfig} actions={actions}>
          <MergePanel tabName="merges" mergeManager={mergeManager.current} />
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
