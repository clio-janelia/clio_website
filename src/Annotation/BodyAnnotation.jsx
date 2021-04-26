import React, { useState, useEffect } from 'react';
// import { useSelector, shallowEqual } from 'react-redux';

import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import {
  getMergeableLayerFromDataset,
  getLocateServiceUrl,
} from '../utils/neuroglancer';
import BodyAnnotationTable from './BodyAnnotationTable';
import BodyAnnotationQuery from './BodyAnnotationQuery';
import {
  queryBodyAnnotations,
  updateBodyAnnotation,
} from './AnnotationRequest';

const useStyles = makeStyles(() => (
  {
    annotationRoot: (props) => ({
      display: 'flex',
      flexFlow: 'column',
      width: props.width,
    }),
    controlRow: {
      display: 'flex',
      flexFlow: 'row',
      justifyContent: 'left',
      minHeight: '0px',
    },
  }
));

export const defaultDvidService = 'https://ngsupport-bmcp5imp6q-uk.a.run.app';
export const defaultLocateService = `${defaultDvidService}/locate-body`;

function BodyAnnotation({
  config, dataset, projectUrl, token, query, onQueryChanged, actions, mergeManager,
}) {
  const classes = useStyles({ width: config.width });
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(false);

  const mergeableLayer = getMergeableLayerFromDataset(dataset);
  // const mergeableLayerName = mergeableLayer && mergeableLayer.name;
  /*
  const segmentationLayer = useSelector(
    (state) => getLayerFromState(state, mergeableLayerName),
    shallowEqual,
  );
  */

  let locateServiceUrl = null;
  if (mergeableLayer) {
    const url = mergeableLayer.location || mergeableLayer.source.url || mergeableLayer.source;
    locateServiceUrl = getLocateServiceUrl(url, config.user);
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

  const rows = annotations.map((annotation) => {
    let locateAction = null;
    const { point, bodyid } = annotation;
    if (point) {
      locateAction = () => {
        actions.setViewerCameraPosition(point);
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
      updateAction: (change) => {
        if (Object.keys(change).length > 0) {
          updateBodyAnnotation(projectUrl, token, dataset, {
            ...change, bodyid,
          }, (newAnnotation) => {
            setAnnotations((prevAnnotations) => updateAnnotations(prevAnnotations, newAnnotation));
          }).catch((error) => {
            const message = `Failed to update annotation for ${bodyid}: ${error.message}.`;
            actions.addAlert({ severity: 'warning', message });
          });
        }
      },
      locateAction,
    };
  });

  useEffect(() => {
    if (query && Object.keys(query).length > 0) {
      setLoading(true);
      queryBodyAnnotations(projectUrl, token, dataset, query).then(
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
  }, [dataset, projectUrl, token, query, actions]);

  return (
    <div className={classes.annotationRoot}>
      <BodyAnnotationQuery
        defaultQueryString={query ? JSON.stringify(query) : ''}
        onQueryChanged={onQueryChanged}
        loading={loading}
        getSelectedSegments={() => mergeManager.selection}
      />
      <hr />
      <BodyAnnotationTable data={rows} dataConfig={config.dataConfig} />
    </div>
  );
}

BodyAnnotation.propTypes = {
  projectUrl: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  dataset: PropTypes.object.isRequired,
  query: PropTypes.object,
  onQueryChanged: PropTypes.func.isRequired,
  actions: PropTypes.object.isRequired,
  mergeManager: PropTypes.object.isRequired,
};

BodyAnnotation.defaultProps = {
  query: null,
};

export default BodyAnnotation;
