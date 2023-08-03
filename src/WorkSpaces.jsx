import PropTypes from 'prop-types';
import React, { Suspense, lazy } from 'react';
import { useRouteMatch, useLocation } from 'react-router-dom';
import { connect } from 'react-redux';

// TODO: probably need to do some defensive loading here to make sure that
// browser can support neuroglancer. If it can't we need to render that message
// instead of the component. -> maybe this should go in the neuroglancer component,
// if possible.
import NeuroGlancer from '@janelia-flyem/react-neuroglancer';

import { addAlert } from './actions/alerts';
import {
  initViewer,
  syncViewer,
  setViewerLayerSource,
  setViewerGrayscaleSource,
  setViewerSegmentationSource,
  setViewerSegmentationLayerName,
  setViewerTodosSource,
  setViewerTodosType,
  setViewerTodosHint,
  setViewerAnnotationSelection,
  setViewerAnnotationTool,
  setViewerCrossSectionScale,
  setViewerCameraPosition,
  setViewerCameraProjectionScale,
  setViewerCameraProjectionOrientation,
  setViewerSegments,
  setViewerSegmentColors,
  setViewerSegmentEquivalences,
  setViewerSegmentQuery,
  addViewerLayer,
  selectViewerLayer,
} from './actions/viewer';

import { setSyncStateNeeded } from './reducers/viewer';

import './Neuroglancer.css';

const ImageSearch = lazy(() => import('./ImageSearch'));
const Annotate = lazy(() => import('./Annotate'));
const Atlas = lazy(() => import('./Atlas'));
const FocusedProofreading = lazy(() => import('./FocusedProofreading'));
const OrphanLink = lazy(() => import('./OrphanLink'));
const BodyReview = lazy(() => import('./BodyReview'));

function WorkSpaces(props) {
  const match = useRouteMatch('/ws/:ws');
  const location = useLocation();
  const {
    viewerState,
    user,
    actions,
    datasets,
    selectedDatasetName,
  } = props;

  let RenderedComponent = null;

  switch (match.params.ws) {
    case 'image_search':
      RenderedComponent = ImageSearch;
      break;
    case 'annotate':
      RenderedComponent = Annotate;
      break;
    case 'atlas':
      RenderedComponent = Atlas;
      break;
    case 'focused_proofreading':
      RenderedComponent = FocusedProofreading;
      break;
    case 'orphan_link':
      RenderedComponent = OrphanLink;
      break;
    case 'body_review':
      RenderedComponent = BodyReview;
      break;
    default:
      RenderedComponent = ImageSearch;
  }

  React.useEffect(() => {
    // After rendering, any changes accumulated in the Redux state have been
    // pushed to react-neuroglancer, and we are ready to synchronize the Redux
    // state with the Neuroglancer component's state before the next changes,
    // in case the user made any changes directly to the component's state.
    setSyncStateNeeded(true);
  });

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RenderedComponent
        user={user}
        location={location}
        actions={actions}
        datasets={datasets}
        selectedDatasetName={selectedDatasetName}
      >
        <NeuroGlancer viewerState={viewerState.get('ngState')} brainMapsClientId="NOT_A_VALID_ID" ngServer=" https://clio-ng.janelia.org" />
      </RenderedComponent>
    </Suspense>
  );
}

WorkSpaces.propTypes = {
  viewerState: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  datasets: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedDatasetName: PropTypes.string,
  actions: PropTypes.object.isRequired,
};

WorkSpaces.defaultProps = {
  selectedDatasetName: null,
};

const WorkSpacesState = (state) => ({
  user: state.user,
  viewerState: state.viewer,
});

const WorkSpacesActions = (dispatch) => ({
  actions: {
    initViewer: (newState) => {
      dispatch(initViewer(newState));
    },
    syncViewer: () => {
      dispatch(syncViewer());
    },
    setViewerLayerSource: (newState) => {
      dispatch(setViewerLayerSource(newState));
    },
    setViewerGrayscaleSource: (newState) => {
      dispatch(setViewerGrayscaleSource(newState));
    },
    setViewerSegmentationSource: (newState) => {
      dispatch(setViewerSegmentationSource(newState));
    },
    setViewerSegmentationLayerName: (newState) => {
      dispatch(setViewerSegmentationLayerName(newState));
    },
    setViewerTodosSource: (newState) => {
      dispatch(setViewerTodosSource(newState));
    },
    setViewerTodosType: (newState) => {
      dispatch(setViewerTodosType(newState));
    },
    setViewerTodosHint: (newState) => {
      dispatch(setViewerTodosHint(newState));
    },
    setViewerAnnotationSelection: (newState) => {
      dispatch(setViewerAnnotationSelection(newState));
    },
    setViewerAnnotationTool: (newState) => {
      dispatch(setViewerAnnotationTool(newState));
    },
    setViewerCrossSectionScale: (newState) => {
      dispatch(setViewerCrossSectionScale(newState));
    },
    setViewerSegments: (newState) => {
      dispatch(setViewerSegments(newState));
    },
    setViewerSegmentColors: (newState) => {
      dispatch(setViewerSegmentColors(newState));
    },
    setViewerSegmentEquivalences: (newState) => {
      dispatch(setViewerSegmentEquivalences(newState));
    },
    setViewerSegmentQuery: (newState) => {
      dispatch(setViewerSegmentQuery(newState));
    },
    setViewerCameraPosition: (newState) => {
      dispatch(setViewerCameraPosition(newState));
    },
    setViewerCameraProjectionScale: (newState) => {
      dispatch(setViewerCameraProjectionScale(newState));
    },
    setViewerCameraProjectionOrientation: (newState) => {
      dispatch(setViewerCameraProjectionOrientation(newState));
    },
    addViewerLayer: (newState) => {
      dispatch(addViewerLayer(newState));
    },
    selectViewerLayer: (newState) => {
      dispatch(selectViewerLayer(newState));
    },
    addAlert: (newState) => {
      dispatch(addAlert(newState));
    },
  },
});

export default connect(
  WorkSpacesState,
  WorkSpacesActions,
)(WorkSpaces);
