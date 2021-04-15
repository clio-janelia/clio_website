import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import {
  getMergeableLayerFromDataset,
  getLocateServiceUrl,
} from '../utils/neuroglancer';
import BodyAnnotationTable from './BodyAnnotationTable';
import BodyAnnotationQuery from './BodyAnnotationQuery';

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

/*
function getRowItemFromAnnotation(key, annotation) {
  return {
    id: key,
    ...annotation,
    locateAction: () => {},
  };
}
*/

export const defaultDvidService = 'https://ngsupport-bmcp5imp6q-uk.a.run.app';
export const defaultLocateService = `${defaultDvidService}/locate-body`;

function BodyAnnotation({
  config, dataset, projectUrl, token, query, onQueryChanged, actions,
}) {
  const classes = useStyles({ width: config.width });
  const [annotations, setAnnotations] = useState({});

  const mergeableLayer = getMergeableLayerFromDataset(dataset);
  let locateServiceUrl = null;
  if (mergeableLayer) {
    const url = mergeableLayer.location || mergeableLayer.source.url || mergeableLayer.source;
    locateServiceUrl = getLocateServiceUrl(url, config.user);
  }

  const rows = Object.keys(annotations).map((key) => ({
    id: key,
    ...annotations[key],
    locateAction: locateServiceUrl ? () => {
      if (locateServiceUrl) {
        fetch(`${locateServiceUrl}&body=${annotations[key].bodyid}`, {
          method: 'GET',
        }).then((response) => response.json()).then((location) => {
          actions.setViewerCameraPosition(location);
        });
      }
    } : null,
  }));

  useEffect(() => {
    if (query && Object.keys(query).length > 0) {
      const url = `${projectUrl}/json-annotations/${dataset.key}/neurons/query`;
      const body = JSON.stringify(query);
      const options = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      };
      fetch(url, options).then(
        (res) => res.json(),
      ).then(
        (res) => setAnnotations(res),
      ).catch((error) => {
        console.log(error);
      });
    } else {
      setAnnotations({});
    }
  }, [dataset, projectUrl, token, query]);

  return (
    <div className={classes.annotationRoot}>
      <BodyAnnotationQuery defaultQueryString={query ? JSON.stringify(query) : ''} onQueryChanged={onQueryChanged} />
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
};

BodyAnnotation.defaultProps = {
  query: null,
};

export default BodyAnnotation;
