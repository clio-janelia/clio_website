import React, { useEffect } from 'react';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import Drawer from '@material-ui/core/Drawer';
import Fab from '@material-ui/core/Fab';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { useSelector, shallowEqual } from 'react-redux';
import { getNeuroglancerColor } from '@janelia-flyem/react-neuroglancer';
import activeElementNeedsKeypress from './utils/events';
import { makeLayersFromDataset } from './utils/neuroglancer';
import AnnotationPanel from './Annotation/AnnotationPanel';
import {
  ANNOTATION_COLUMNS, ATLAS_COLUMNS, ANNOTATION_SHADER, ATLAS_SHADER,
} from './Annotation/AnnotationUtils';
import NeuPrintManager from './Connections/NeuPrintManager';
import ConnectionsPanel from './Connections/ConnectionsPanel';
import MergeBackendCloud from './Annotation/MergeBackendCloud';
import MergeManager from './Annotation/MergeManager';
import { MergePanel, onKeyPressMerge, onVisibleChangedMerge } from './Annotation/MergePanel';

import './Neuroglancer.css';

const SIDEBAR_WIDTH_PX = 500;
const SIDEBAR_SPACING_PX = 10;

const useStyles = makeStyles((theme) => {
  const fabSidebar = {
    position: 'absolute',
    bottom: theme.spacing(2),
    // Necessary for events to go to a button on top of Neuroglancer.
    zIndex: 3,
  };
  const ngSidebar = {
    display: 'flex',
    flexFlow: 'column',
    height: '100%',
    flexGrow: 1,
  };
  return ({
    fabSidebarOpen: {
      ...fabSidebar,
      transition: theme.transitions.create(['right'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      right: `${SIDEBAR_WIDTH_PX + SIDEBAR_SPACING_PX}px`,
    },
    fabSidebarClosed: {
      ...fabSidebar,
      transition: theme.transitions.create(['right'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      right: `${SIDEBAR_SPACING_PX}px`,
    },
    ngSidebarOpen: {
      ...ngSidebar,
      transition: theme.transitions.create(['margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      marginRight: SIDEBAR_WIDTH_PX,
    },
    ngSidebarClosed: {
      ...ngSidebar,
      transition: theme.transitions.create(['margin'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginRight: 0,
    },
    drawerPaper: {
      top: 'inherit',
    },
  });
});

// eslint-disable-next-line object-curly-newline
export default function Annotate({ children, actions, datasets, selectedDatasetName }) {
  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);
  const dataset = datasets.filter((ds) => ds.name === selectedDatasetName)[0];
  const projectUrl = useSelector((state) => state.clio.get('projectUrl'), shallowEqual);
  const classes = useStyles();

  useEffect(() => {
    if (dataset && user) {
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
          shader: ANNOTATION_SHADER,
          tool: 'annotatePoint',
        },
        {
          name: 'atlas',
          type: 'annotation',
          source: {
            url: `clio://${projectUrl}/${dataset.name}?auth=neurohub&kind=atlas`,
          },
          shader: ATLAS_SHADER,
          tool: 'annotatePoint',
        },
        ...makeLayersFromDataset(dataset, true),
      ];

      const viewerOptions = {
        position: [],
        crossSectionScale: 100,
        projectionScale: 2600,
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
      } else {
        viewerOptions.dimensions = {
          x: [8e-9, 'm'],
          y: [8e-9, 'm'],
          z: [8e-9, 'm'],
        };
      }

      actions.initViewer(viewerOptions);
    }
  }, [user, actions, dataset, projectUrl]);

  const neuPrintManager = React.useRef(new NeuPrintManager());
  useEffect(() => {
    if (dataset && user) {
      const token = user.getAuthResponse().id_token;
      neuPrintManager.current.init(dataset, projectUrl, token, actions.addAlert);
    }
  }, [actions, dataset, projectUrl, neuPrintManager, user]);

  const mergeManager = React.useRef(new MergeManager());
  useEffect(() => {
    if (dataset && user) {
      const token = user.getAuthResponse().id_token;
      const backend = new MergeBackendCloud(dataset, projectUrl, token, actions.addAlert);
      mergeManager.current.init(actions, getNeuroglancerColor, backend, neuPrintManager.current);
    }
  }, [actions, dataset, projectUrl, mergeManager, user]);

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

  const selectionDetailsStateChangedHandlers = [];
  const onSelectionDetailsStateChanged = () => {
    selectionDetailsStateChangedHandlers.forEach((handler) => {
      handler();
    });
  };

  // Add `onVisibleChanged` to the props of the child, which is a react-neuroglancer viewer.
  const childrenWithMoreProps = React.Children.map(children, (child) => (
    React.cloneElement(child, { onVisibleChanged, onSelectionDetailsStateChanged }, null)
  ));

  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  if (dataset) {
    const pointTool = {
      name: 'annotatePoint',
      label: 'Point',
      tooltip: 'Ctrl+Click in the data viewer to add a point.',
    };
    const lineTool = {
      name: 'annotateLine',
      label: 'Line',
      tooltip: 'Ctrl+Click in the data viewer to start adding a line. Ctrl+Click again to finish the line.',
    };

    const setSelectionChangedCallback = (callback) => {
      selectionDetailsStateChangedHandlers.splice(
        0, selectionDetailsStateChangedHandlers.length,
      );
      selectionDetailsStateChangedHandlers.push(callback);

      return () => {
        const index = selectionDetailsStateChangedHandlers.indexOf(callback);
        if (index !== -1) {
          selectionDetailsStateChangedHandlers.splice(index, 1);
        }
      };
    };

    const annotationConfig = {
      width: `${SIDEBAR_WIDTH_PX}px`,
      datasetName: dataset.name,
      layers: [
        {
          name: 'annotations',
          tools: [pointTool, lineTool],
          dataConfig: {
            columns: ANNOTATION_COLUMNS,
            kind: 'Normal',
            allowingImport: true,
            allowingExport: true,
            token: user.getAuthResponse().id_token,
          },
          setSelectionChangedCallback,
          dataSource: dataset.name,
        },
        {
          name: 'atlas',
          tools: [pointTool],
          dataConfig: {
            columns: ATLAS_COLUMNS,
            kind: 'Atlas',
            allowingImport: false,
            allowingExport: true,
            token: user.getAuthResponse().id_token,
          },
          setSelectionChangedCallback,
          dataSource: dataset.name,
        },
      ],
    };

    const onClickFab = () => {
      // Prevents Neuroglancer `position` from being reset.
      actions.syncViewer();
      setSidebarOpen(!sidebarOpen);
    };

    return (
      <div
        style={{ display: 'flex', height: '100%' }}
      >
        <div
          className={sidebarOpen ? classes.ngSidebarOpen : classes.ngSidebarClosed}
          tabIndex={0}
          onKeyPress={onKeyPress}
          onContextMenu={(event) => {
            event.preventDefault();
          }}
        >
          {childrenWithMoreProps}
        </div>

        <Fab
          className={sidebarOpen ? classes.fabSidebarOpen : classes.fabSidebarClosed}
          color="primary"
          onClick={onClickFab}
        >
          {sidebarOpen ? <ChevronRight /> : <ChevronLeft />}
        </Fab>

        <Drawer
          variant="persistent"
          anchor="right"
          open={sidebarOpen}
          classes={{
            paper: classes.drawerPaper,
          }}
        >
          <AnnotationPanel config={annotationConfig} actions={actions}>
            <MergePanel
              tabName="merges"
              mergeManager={mergeManager.current}
            />
            <ConnectionsPanel
              tabName="connections"
              neuPrintManager={neuPrintManager.current}
              mergeManager={mergeManager.current}
            />
          </AnnotationPanel>
        </Drawer>
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
