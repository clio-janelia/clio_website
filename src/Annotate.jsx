import React, { useEffect, useState } from 'react';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import Drawer from '@material-ui/core/Drawer';
import Fab from '@material-ui/core/Fab';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { useSelector, shallowEqual } from 'react-redux';
import { getNeuroglancerColor } from '@janelia-flyem/react-neuroglancer';
import activeElementNeedsKeypress from './utils/events';
import {
  makeLayersFromDataset,
  hasMergeableLayer,
  makeViewOptionsFromDataset,
} from './utils/neuroglancer';
import AnnotationPanel from './Annotation/AnnotationPanel';
import {
  ATLAS_COLUMNS,
  ANNOTATION_SHADER,
  ATLAS_SHADER,
  getAnnotationColumnSetting,
  getBodyAnnotationColumnSetting,
} from './Annotation/AnnotationUtils';
import NeuPrintManager from './Connections/NeuPrintManager';
import ConnectionsPanel from './Connections/ConnectionsPanel';
import MergeBackendCloud from './Annotation/MergeBackendCloud';
import MergeManager from './Annotation/MergeManager';
import { MergePanel, onKeyPressMerge, onVisibleChangedMerge } from './Annotation/MergePanel';
import BodyAnnotation from './Annotation/BodyAnnotation';

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
  const [bodyAnnotatinQuery, setBodyAnnotationQuery] = useState(null);

  const roles = useSelector((state) => state.user.get('roles'), shallowEqual);
  let { groups } = roles;
  if (groups && groups.length > 0) {
    if (!roles.global_roles || roles.global_roles.indexOf('admin') === -1) {
      groups = groups.filter((group) => !group.startsWith('.'));
    }
  }

  const getAnnotationUrl = React.useCallback(
    (isAtlas) => `clio://${projectUrl}/${dataset.key}?auth=neurohub${isAtlas ? '&kind=atlas' : ''}`,
    [projectUrl, dataset],
  );

  useEffect(() => {
    if (dataset && user) {
      const layers = [
        ...makeLayersFromDataset(dataset, true),
        {
          name: 'annotations',
          type: 'annotation',
          source: {
            url: getAnnotationUrl(false),
          },
          shader: ANNOTATION_SHADER,
          tool: 'annotatePoint',
        },
        {
          name: 'atlas',
          type: 'annotation',
          source: {
            url: getAnnotationUrl(true),
          },
          shader: ATLAS_SHADER,
          tool: 'annotatePoint',
        },
      ];

      const viewerOptions = makeViewOptionsFromDataset(
        dataset,
        {
          crossSectionScale: null,
          projectionScale: null,
          layers,
          selectedLayer: {
            layer: 'annotations',
          },
        },
      );

      actions.initViewer(viewerOptions);
    }
  }, [user, actions, dataset, getAnnotationUrl]);

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
    if (hasMergeableLayer(dataset)) {
      onKeyPressMerge(event, mergeManager.current);
    }
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

    const bodyAnnotationConfig = {
      width: `${SIDEBAR_WIDTH_PX}px`,
      // datasetName: dataset.name,
      user: roles.email,
      dataConfig: {
        columns: getBodyAnnotationColumnSetting(dataset),
      },
    };

    const annotationConfig = {
      width: `${SIDEBAR_WIDTH_PX}px`,
      datasetName: dataset.name,
      user: roles.email,
      layers: [
        {
          name: 'annotations',
          tools: [pointTool, lineTool],
          dataConfig: {
            columns: getAnnotationColumnSetting(dataset),
            kind: 'Normal',
            allowingImport: true,
            allowingExport: true,
            token: user.getAuthResponse().id_token,
          },
          setSelectionChangedCallback,
          dataSource: {
            name: dataset.name,
            url: getAnnotationUrl(false),
            groups,
          },
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
          dataSource: {
            name: dataset.name,
            url: getAnnotationUrl(true),
            groups,
          },
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
          <AnnotationPanel
            config={annotationConfig}
            actions={actions}
          >
            {
              bodyAnnotationConfig.dataConfig.columns ? (
                <BodyAnnotation
                  tabName="bodies"
                  config={bodyAnnotationConfig}
                  dataset={dataset}
                  projectUrl={projectUrl}
                  token={user ? user.getAuthResponse().id_token : ''}
                  query={bodyAnnotatinQuery}
                  onQueryChanged={(query) => setBodyAnnotationQuery(query)}
                  actions={actions}
                />
              ) : null
            }
            {
              hasMergeableLayer(dataset) ? (
                <MergePanel
                  tabName="merges"
                  mergeManager={mergeManager.current}
                  addAlert={actions.addAlert}
                />
              ) : null
            }
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
  selectedDatasetName: PropTypes.string,
};

Annotate.defaultProps = {
  selectedDatasetName: null,
};
