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
  const [annotations, setAnnotations] = useState({});
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

  const rows = Object.keys(annotations).map((key) => {
    let locateAction = null;
    const { point } = annotations[key];
    if (point) {
      locateAction = () => {
        actions.setViewerCameraPosition(point);
      };
    } else if (locateServiceUrl) {
      locateAction = () => {
        if (annotations[key].point) {
          actions.setViewerCameraPosition(annotations[key].point);
        } else if (locateServiceUrl) {
          fetch(`${locateServiceUrl}&body=${annotations[key].bodyid}`, {
            method: 'GET',
          }).then((response) => response.json()).then((location) => {
            actions.setViewerCameraPosition(location);
          });
        }
      };
    }
    return {
      id: key,
      ...annotations[key],
      updateAction: (change) => {
        if (Object.keys(change).length > 0) {
          updateBodyAnnotation(projectUrl, token, dataset, {
            ...change, bodyid: annotations[key].bodyid,
          }, (newAnnotation) => {
            setAnnotations({ ...annotations, [key]: newAnnotation });
          }).catch((error) => {
            const message = `Failed to update annotation for ${key}.`;
            actions.addAlert({ severity: 'warning', message });
            console.log(error);
          });
        }
      },
      locateAction,
    };
  });

  useEffect(() => {
    if (query && Object.keys(query).length > 0) {
      if (query.bodyid) {
        const newAnnotations = {};
        query.bodyid.forEach((body) => {
          newAnnotations[body] = {
            bodyid: body,
          };
        });
        setAnnotations(newAnnotations);
      } else {
        setLoading(true);
        queryBodyAnnotations(projectUrl, token, dataset, query).then(
          (res) => {
            if (query.field === 'bodyid') {
              if (Array.isArray(query.value)) {
                query.value.forEach((id) => {
                  if (!(id in res)) {
                    res[id] = { bodyid: id };
                  }
                });
              }
            }
            setAnnotations(res);
            setLoading(false);
          },
        ).catch((error) => {
          const message = 'Failed to query bodies.';
          actions.addAlert({ severity: 'warning', message });
          console.log(error);
          setLoading(false);
        });
      }
    } else {
      setAnnotations({});
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
