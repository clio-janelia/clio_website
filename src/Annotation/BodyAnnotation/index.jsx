import React, { useState, useEffect } from 'react';
// import { useSelector, shallowEqual } from 'react-redux';

import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import {
  getMergeableLayerFromDataset,
  getLocateServiceUrl,
} from '../../utils/neuroglancer';
import BodyViewControl from './BodyViewControl';
import BodyAnnotationTable from './BodyAnnotationTable';
import BodyAnnotationQuery from './BodyAnnotationQuery';
import {
  queryBodyAnnotations,
  updateBodyAnnotation,
} from '../AnnotationRequest';

const useStyles = makeStyles(() => (
  {
    annotationRoot: (props) => ({
      display: 'flex',
      flexFlow: 'column',
      width: props.width,
    }),
  }
));

export const defaultDvidService = 'https://ngsupport-bmcp5imp6q-uk.a.run.app';
export const defaultLocateService = `${defaultDvidService}/locate-body`;

function BodyAnnotation({
  config, dataset, projectUrl, getToken, query, onQueryChanged, actions, mergeManager,
}) {
  const classes = useStyles({ width: config.width });
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(false);

  const mergeableLayer = getMergeableLayerFromDataset(dataset);
  const mergeableLayerName = mergeableLayer && mergeableLayer.name;
  /*
  const segmentationLayer = useSelector(
    (state) => getLayerFromState(state, mergeableLayerName),
    shallowEqual,
  );
  */

  let locateServiceUrl = null;
  if (mergeableLayer) {
    const url = mergeableLayer.location || mergeableLayer.source.url || mergeableLayer.source;
    if (url) {
      locateServiceUrl = getLocateServiceUrl(url, config.user);
    } else {
      console.warn('No location found for mergeable layer', mergeableLayer);
    }
  }

  const updateAnnotations = (oldAnnotations, newAnnotation) => {
    const newAnnotations = [...oldAnnotations];
    const annotationIndex = oldAnnotations.findIndex((a) => (a.bodyid === newAnnotation.bodyid));
    if (annotationIndex >= 0) {
      newAnnotations[annotationIndex] = newAnnotation;
    } else {
      newAnnotations.push(newAnnotation);
    }

    return newAnnotations;
  };

  const rows = React.useMemo(() => annotations.map((annotation) => {
    let locateAction = null;
    const { position, point, bodyid } = annotation;
    const predefinedPosition = position || point;

    const updateAction = (change) => {
      if (Object.keys(change).length > 0) {
        const newAnnotation = {
          ...change, bodyid,
        };
        if (change.position) {
          newAnnotation.position_type = change.position.length > 0 ? 'user' : 'deleted';
        }
        updateBodyAnnotation(
          projectUrl, getToken(), config.user, dataset, newAnnotation, (updated) => {
            setAnnotations((prevAnnotations) => updateAnnotations(prevAnnotations, updated));
          },
        ).catch((error) => {
          const message = `Failed to update annotation for ${bodyid}: ${error.message}.`;
          actions.addAlert({ severity: 'warning', message });
        });
      }
    };

    if (predefinedPosition && predefinedPosition.length === 3) {
      locateAction = () => {
        actions.setViewerCameraPosition(predefinedPosition);
      };
    } else if (locateServiceUrl) {
      locateAction = () => {
        fetch(`${locateServiceUrl}&body=${annotation.bodyid}`, {
          method: 'GET',
        }).then((response) => response.json()).then((location) => {
          actions.setViewerCameraPosition(location);
        });
      };
    }
    return {
      id: bodyid,
      ...annotation,
      updateAction,
      locateAction,
    };
  }), [annotations, actions, config.user, dataset, locateServiceUrl, projectUrl, getToken]);

  useEffect(() => {
    if (query && Object.keys(query).length > 0) {
      setLoading(true);
      queryBodyAnnotations(projectUrl, getToken(), dataset, query).then(
        (response) => {
          setAnnotations(response);
          setLoading(false);
        },
      ).catch((error) => {
        const message = `Failed to query bodies: ${error.message}.`;
        actions.addAlert({ severity: 'warning', message });
        setLoading(false);
      });
    } else {
      setAnnotations([]);
    }
  }, [dataset, projectUrl, getToken, query, actions]);

  const showBodies = React.useCallback((ids) => {
    actions.setViewerSegments(ids);
  }, [actions]);

  const setBodyColor = React.useCallback((ids, color) => {
    if (ids.length > 0) {
      const segmentColors = ids.reduce((acc, id) => {
        acc[id] = color;
        return acc;
      }, {});
      actions.setViewerSegmentColors({ layerName: mergeableLayerName, segmentColors, mode: 'append' });
    }
  }, [actions, mergeableLayerName]);

  const resetBodySelection = React.useCallback(() => {
    actions.setViewerSegments([]);
  }, [actions]);

  const resetBodyColor = React.useCallback(() => {
    actions.setViewerSegmentColors({ layerName: mergeableLayerName, segmentColors: {}, mode: 'replace' });
  }, [actions, mergeableLayerName]);

  const localize = React.useCallback((pos) => {
    actions.setViewerCameraPosition(pos);
  }, [actions]);

  return (
    <div className={classes.annotationRoot}>
      <BodyViewControl
        resetBodySelection={resetBodySelection}
        resetBodyColor={resetBodyColor}
      />
      <BodyAnnotationQuery
        defaultQuery={query}
        onQueryChanged={onQueryChanged}
        loading={loading}
        getSelectedSegments={() => mergeManager.selection}
        addAlert={actions.addAlert}
      />
      <hr />
      <BodyAnnotationTable
        data={rows}
        dataConfig={config.dataConfig}
        datasetName={dataset.name}
        showBodies={showBodies}
        setBodyColor={setBodyColor}
        localize={localize}
      />
    </div>
  );
}

BodyAnnotation.propTypes = {
  projectUrl: PropTypes.string.isRequired,
  getToken: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  dataset: PropTypes.object.isRequired,
  query: PropTypes.oneOfType(PropTypes.object, PropTypes.arrayOf(PropTypes.object)),
  onQueryChanged: PropTypes.func.isRequired,
  actions: PropTypes.object.isRequired,
  mergeManager: PropTypes.object.isRequired,
};

BodyAnnotation.defaultProps = {
  query: null,
};

export default React.memo(BodyAnnotation);
