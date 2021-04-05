import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';

import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import AnnotationsList from './Atlas/AnnotationsList';
import AnnotationsFilter from './Atlas/AnnotationsFilter';
import DatasetFilter from './Atlas/DatasetFilter';
import FilterType from './Atlas/FilterType';
import VerifyType from './Atlas/VerifyType';
import { addAlert } from './actions/alerts';
import { canWrite } from './utils/permissions';
import { makeLayersFromDataset, makeViewOptionsFromDataset } from './utils/neuroglancer';

const useStyles = makeStyles({
  window: {
    display: 'flex',
    flexFlow: 'column',
    height: '100%',
  },
  matches: {
    margin: '1em',
  },
  header: {
    margin: '1em',
    flexGrow: 1,
  },
  list: {
    marginTop: '1em',
  },
  expand: {
    display: 'flex',
    flexFlow: 'column',
    height: '100%',
  },
});

const minAnnotations = 4;
const maxAnnotations = 12;

export default function Atlas(props) {
  const { children, actions, datasets } = props;
  const dispatch = useDispatch();
  const classes = useStyles();

  const [selectedAnnotation, setSelected] = useState(null);
  const [filterType, setFilterType] = useState('Title or description');
  const [filterTerm, setFilterTerm] = useState('');
  const [verifyType, setVerifyType] = useState('Verified or unverified');
  const [datasetFilter, setDataSetFilter] = useState([]);
  const [dsLookup, setDsLookup] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showList, setShowList] = useState(true);
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState('preload');
  const projectUrl = useSelector((state) => state.clio.get('projectUrl'), shallowEqual);
  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);
  const roles = useSelector((state) => state.user.get('roles'), shallowEqual);

  useEffect(() => {
    // load the annotations from an end point
    if (projectUrl) {
      setLoading('fetching');
      const annotationsUrl = `${projectUrl}/atlas/all`;

      const options = {
        headers: {
          Authorization: `Bearer ${user.getAuthResponse().id_token}`,
        },
      };

      fetch(annotationsUrl, options)
        .then((result) => result.json())
        .then((data) => {
          // sort them so that the newest ones are first in the list.
          const sorted = data.sort((a, b) => b.timestamp - a.timestamp);
          setAnnotations(sorted);
          setLoading('success');
        })
        .catch((error) => {
          console.log(error);
          setLoading('failed');
        });
    }
  }, [projectUrl, user]);

  useEffect(() => {
    const datasetLookup = {};
    datasets.forEach((dataset) => {
      datasetLookup[dataset.name] = dataset;
    });
    setDsLookup(datasetLookup);
  }, [datasets]);

  useEffect(() => {
    if (selectedAnnotation) {
      const selectedDataset = dsLookup[selectedAnnotation.dataset];

      const layers = [
        ...makeLayersFromDataset(selectedDataset, false),
        {
          name: 'annotations',
          type: 'annotation',
          source: {
            url: `clio://${projectUrl}/${selectedDataset.name}?auth=neurohub&kind=atlas`,
          },
        },
      ];

      const viewerOptions = makeViewOptionsFromDataset(selectedDataset, {
        position: selectedAnnotation.location,
        crossSectionScale: 2,
        projectionScale: 2600,
        layers,
        layout: 'xy',
      });

      actions.initViewer(viewerOptions);
    }
  }, [actions, selectedAnnotation, projectUrl, dsLookup]);

  const handleClearSelection = () => {
    // figure out the page the currently selected annotation is on when
    // the view is not displayed/
    const annotationIndex = annotations.findIndex(
      (item) => (
        item.locationkey === selectedAnnotation.locationkey
        && item.dataset === selectedAnnotation.dataset
        && item.user === selectedAnnotation.user
      ),
    );

    setSelected(null);
    setShowList(true);
    setCurrentPage(Math.ceil((annotationIndex + 1) / maxAnnotations));
  };

  if (loading === 'failed') {
    return <Typography variant="h5">Failed to load EM Atlas Annotations</Typography>;
  }

  if (loading !== 'success') {
    return (
      <div className={classes.expand}>
        <div className={classes.header}>
          <Grid container spacing={0}>
            <Grid item xs={12} sm={2}>
              <Typography variant="h5">EM Atlas</Typography>
            </Grid>
          </Grid>
        </div>
      </div>
    );
  }

  // do annotation filtering here

  let filteredAnnotations = annotations;
  const annotationsPerPage = selectedAnnotation ? minAnnotations : maxAnnotations;

  if (datasetFilter && datasetFilter.length > 0) {
    /* eslint-disable-next-line max-len */
    filteredAnnotations = annotations.filter((annotation) => datasetFilter.includes(annotation.dataset));
  }

  if (filterTerm) {
    let category = null;
    if (filterType !== 'Title or description') {
      category = filterType.toLowerCase();
    }

    const re = new RegExp(filterTerm, 'i');

    if (category) {
      const categories = ['title', 'description'];
      if (categories.includes(category)) {
        filteredAnnotations = filteredAnnotations.filter((annot) => re.test(annot[category]));
      }
    } else {
      filteredAnnotations = filteredAnnotations.filter(
        /* eslint-disable-next-line max-len */
        (annot) => re.test(annot.title) || re.test(annot.description) || re.test(dsLookup[annot.dataset].description),
      );
    }
  }

  if (verifyType !== 'Verified or unverified') {
    const testval = (verifyType === 'Verified');
    filteredAnnotations = filteredAnnotations.filter(
      (annot) => annot.verified === testval,
    );
  }

  // must come after the filter code or it wont work.
  const pages = Math.ceil(filteredAnnotations.length / annotationsPerPage);
  const paginatedAnnotations = filteredAnnotations.slice(
    currentPage * annotationsPerPage - annotationsPerPage,
    currentPage * annotationsPerPage,
  );

  const handleAnnotationSelect = (annotation) => {
    const annotationIndex = annotations.findIndex(
      (item) => (
        item.locationkey === annotation.locationkey
        && item.dataset === annotation.dataset
        && item.user === annotation.user
      ),
    );
    setSelected(annotation);
    setCurrentPage(Math.ceil((annotationIndex + 1) / minAnnotations));
  };

  const handleVerified = () => {
    const verified = {
      ...selectedAnnotation,
      verified: !selectedAnnotation.verified,
    };
    // submit the verified component to the backend
    const options = {
      headers: {
        Authorization: `Bearer ${user.getAuthResponse().id_token}`,
      },
      method: 'POST',
      body: JSON.stringify(verified),
    };

    const point = verified.location;
    const queryCoords = `x=${point[0]}&y=${point[1]}&z=${point[2]}`;
    const atlasUrl = `${projectUrl}/atlas/${verified.dataset}?${queryCoords}`;

    fetch(atlasUrl, options)
      .then((response) => response.json()
        .then((json) => {
          if (response.ok) {
            return json;
          }
          return Promise.reject(json);
        }))
      .then((data) => {
        dispatch(addAlert({ severity: 'success', message: 'Annotation verified' }));
        // need to update the UI to show the annotation is now verified.
        const updatedAnnotations = annotations.map((annotation) => {
          if (data.locationkey === annotation.locationkey
            && data.dataset === annotation.dataset
            && data.user === annotation.user
          ) {
            return data;
          }
          return annotation;
        });
        setAnnotations(updatedAnnotations);
        setSelected(data);
      })
      .catch((error) => {
        if (error.detail) {
          dispatch(addAlert({
            severity: 'error',
            message: `Failed to verify annotation: ${error.detail}`,
          }));
        } else {
          console.log(error);
          dispatch(addAlert({
            severity: 'error',
            message: 'Failed to verify annotation: error communicating with the server',
          }));
        }
      });
  };

  // user has clio write
  const allowedToVerifyAnnotaton = selectedAnnotation
                                   && canWrite(roles, selectedAnnotation.dataset);
  const alreadyVerified = selectedAnnotation && selectedAnnotation.verified;


  return (
    <div className={classes.expand}>
      <div className={classes.header}>
        <Grid container spacing={0}>
          <Grid item xs={12} sm={1}>
            <Typography variant="h5">EM Atlas</Typography>
          </Grid>
          {showList && (
            <>
              <Grid item xs={12} sm={3}>
                <DatasetFilter
                  datasets={datasets.map((dataset) => dataset.name)}
                  selected={datasetFilter}
                  onChange={setDataSetFilter}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <VerifyType
                  selected={verifyType}
                  onChange={setVerifyType}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <FilterType
                  selected={filterType}
                  onChange={setFilterType}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <AnnotationsFilter term={filterTerm} onChange={setFilterTerm} />
              </Grid>
              <Grid item xs={12} sm={2} />
              <Grid item xs={12} className={classes.list}>
                <AnnotationsList
                  pages={pages}
                  datasets={dsLookup}
                  currentPage={currentPage}
                  annotations={paginatedAnnotations}
                  loading={!(loading === 'success')}
                  selected={selectedAnnotation || {}}
                  onSelect={handleAnnotationSelect}
                  onChange={setCurrentPage}
                />
              </Grid>
            </>
          )}
          {selectedAnnotation && (
            <Grid item xs={12} sm={10}>
              <p>
                Showing details for annotation {selectedAnnotation.title} in neuroglancer{' '}
                <Button variant="contained" color="primary" onClick={handleClearSelection}>
                  Clear Selection
                </Button>{' '}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setShowList((current) => !current)}
                >
                  Toggle Annotation List
                </Button>{' '}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleVerified}
                  disabled={!allowedToVerifyAnnotaton}
                >
                  {alreadyVerified ? 'Unverify' : 'Verify Annotation'}
                </Button>

              </p>
            </Grid>
          )}
        </Grid>
      </div>

      {selectedAnnotation && (
        <div className={classes.window} onContextMenu={(e) => e.preventDefault()}>{children}</div>
      )}
    </div>
  );
}

Atlas.propTypes = {
  children: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  datasets: PropTypes.arrayOf(PropTypes.object).isRequired,
};
