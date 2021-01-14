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
import AnnotationPanel from './Annotation/AnnotationPanel';
import config from './config';
import {
  ANNOTATION_COLUMNS, ATLAS_COLUMNS, ANNOTATION_SHADER, ATLAS_SHADER,
} from './Annotation/AnnotationUtils';
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
  const classes = useStyles();

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
        },
        {
          name: 'annotations',
          type: 'annotation',
          source: {
            url: `clio://${annotationsUrl}/${dataset.name}?auth=neurohub`,
          },
          shader: ANNOTATION_SHADER,
          tool: 'annotatePoint',
        },
        {
          name: 'atlas',
          type: 'annotation',
          source: {
            url: `clio://${annotationsUrl}/${dataset.name}?auth=neurohub&kind=atlas`,
          },
          shader: ATLAS_SHADER,
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
      const token = user.getAuthResponse().id_token;
      const backend = new MergeBackendCloud(dataset.name, projectUrl, token, actions.addAlert);
      mergeManager.current.init(actions, getNeuroglancerColor, backend);
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

  // Add `onVisibleChanged` to the props of the child, which is a react-neuroglancer viewer.
  const childrenWithMoreProps = React.Children.map(children, (child) => (
    React.cloneElement(child, { onVisibleChanged }, null)
  ));

  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  if (dataset) {
    const annotationConfig = {
      width: `${SIDEBAR_WIDTH_PX}px`,
      layers: [
        {
          name: 'annotations',
          tools: ['annotatePoint', 'annotateLine'],
          dataConfig: {
            columns: ANNOTATION_COLUMNS,
          },
        },
        {
          name: 'atlas',
          dataConfig: {
            columns: ATLAS_COLUMNS,
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
            <MergePanel tabName="merges" mergeManager={mergeManager.current} />
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
