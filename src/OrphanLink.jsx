import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import { getAnnotationLayer, getNeuroglancerViewerState } from '@janelia-flyem/react-neuroglancer';
import HelpIcon from '@material-ui/icons/Help';
import IconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';
import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { createMuiTheme, useTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import Select from 'react-select';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import activeElementNeedsKeypress from './utils/events';
import { queryBodyAnnotations, updateBodyAnnotation } from './Annotation/AnnotationRequest';
import { AssignmentManager, AssignmentManagerDialog } from './AssignmentManager';
import ClientInfo from './ClientInfo';
import { DvidManager, DvidManagerDialog } from './DvidManager';
import './OrphanLink.css';
import ProtocolHelp from './ProtocolHelp';
import {
  getMergeableLayerFromDataset, getMainImageLayer, getLayerSourceUrl,
  makeLayersFromDataset, makeViewOptionsFromDataset,
} from './utils/neuroglancer';

// Use a default theme for dialogs, so their text is the normal size.
const dialogTheme = createMuiTheme({
});

//

// TODO: Make a general mechanism for user-modifiable key bindings.
const keyBindings = {
  protocolNextTask: { key: 'e', help: 'Next task' },
  protocolPrevTask: { key: 'q', help: 'Previous task' },
  protocolCompletedAndNextTask1: { key: 'E', help: 'Next task and check "Completed"' },
  protocolCompletedAndNextTask2: { key: 'X', help: 'Next task and check "Completed"' },
  orphanLinkInitialView: { key: 'i', help: "Use task's initial view" },
};

//
// Constants

const TASK_KEYS = Object.freeze({
  GRAYSCALE_SOURCE: 'grayscale source',
  SEGMENTATION_SOURCE: 'segmentation source',
  DVID_SOURCE: 'DVID source',
  DATASET_NAME: 'dataset',
  BODY_PT: 'body point',
  // Optional keys, needed if the segmentation source does not support DVID commands.
  BBOX: 'default bounding box',
  EXTRA_BODY_IDS: 'extra body IDs',
});

// CSS "medium purple"
const COLOR_PRIMARY_BODY = '#8A2BE2';

const RESULTS_INSTANCE = 'segmentation_staged_merges';

const CLIENT_INFO = new ClientInfo();

//
// Functions that can be factored out of the React component (because they don't use hooks)

const bodyPoint = (taskJson) => {
  if (TASK_KEYS.BODY_PT in taskJson) {
    return (taskJson[TASK_KEYS.BODY_PT]);
  }
  return (undefined);
};

const getBodyId = (bodyPt, dvidMngr, taskJson, onError) => {
  let error;
  return (
    dvidMngr.getBodyId(bodyPt, (err) => { error = err; })
      .then((bodyId) => {
        let id = bodyId;
        if (!id) {
          id = taskJson[TASK_KEYS.BODY_ID];
        }
        if (!id) {
          if (!error) {
            error = `No body ID for point ${bodyPt}`;
          }
          onError(error);
        }
        return (id);
      })
  );
};

const getBbox = (bodyId, dvidMngr, taskJson) => (
  dvidMngr.getSparseVolSize(bodyId, () => {})
    .then((bboxData) => {
      let data = bboxData;
      if (!data) {
        data = taskJson[TASK_KEYS.BBOX];
      }
      if (!data) {
        // Lacking any true bounding box, return fixed values that will make the
        // scale be 10000, a value which is plausible based on some hemibrain data.
        data = { minvoxel: [0, 0, 0], maxvoxel: [0, 10000, 0] };
      }
      return (data);
    })
);

const getExtraBodyIds = (taskJson, bodyId) => {
  if (TASK_KEYS.EXTRA_BODY_IDS in taskJson) {
    const extra = taskJson[TASK_KEYS.EXTRA_BODY_IDS];
    const result = extra.filter((id) => bodyId !== id);
    return (result);
  }
  return ([]);
};


const taskDocString = (taskJson, assnMngr) => {
  if (taskJson) {
    let indexStr = ` ${taskJson.index + 1}`;
    indexStr += ` (${assnMngr.completedPercentage()}%)`;
    return (`${'\xa0'}Task${indexStr}:${'\xa0'}`);
  }
  if (Object.keys(assnMngr.assignment).length !== 0) {
    return (`${'\xa0'}Loading...`);
  }
  return ('');
};

const taskDocTooltip = (taskJson, assnMngr) => (
  taskJson ? `${assnMngr.assignmentFile} [${taskJson[TASK_KEYS.BODY_ID]}]` : ''
);

const bodyColors = (segments, colorAsMerged) => (
  colorAsMerged ? segments.reduce((a, c) => ({ ...a, [c]: COLOR_PRIMARY_BODY }), {}) : {}
);

const cameraPose = (bodyPt) => {
  const position = bodyPt;
  // Viewing direction is down the Z axis.
  const angle = Math.PI / 2;
  // Convert that angle and the rotation axis (the Y axis) into a quaternion.
  const c = Math.cos(angle / 2);
  const s = Math.sin(angle / 2);
  const projectionOrientation = [0, s, 0, c];

  return ({ position, projectionOrientation });
};

const cameraProjectionScale = (bodyId, orientation, taskJson, dvidMngr) => {
  // TODO: Make `onError` an argument, for error handling specific to the 'get' calls here.
  const onError = (err) => {
    console.error('Failed to get body size: ', err);
  };
  return (
    getBbox(bodyId, dvidMngr, taskJson, onError)
      .then((data) => {
        // The heuristics here consider the sizes of bounding box dimensions (sides)
        // as seen with the current camera orientation.  This orientation is a rotation
        // around the Y axis.  A bounding box X dimension apears scaled by the cosine of
        // the camera angle, and the Z by the sine.  The Y dimension is unscaled.
        const angle = Math.acos(orientation[3]) * 2;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        // For the normal scale, use the body's bounding box, and pick the
        // scaled dimension that is bigger.
        const dims = [data.maxvoxel[0] - data.minvoxel[0], data.maxvoxel[1] - data.minvoxel[1],
          data.maxvoxel[2] - data.minvoxel[2]];
        const visibleX = Math.abs(c * dims[0]);
        const visibleZ = Math.abs(s * dims[2]);
        const scale = Math.max(visibleX, dims[1], visibleZ);
        return (scale);
      })
      .catch(onError)
  );
};

const dvidLogKey = (taskJson, userEmail) => (
  `${taskJson[TASK_KEYS.BODY_PT]}_${userEmail}`.replace(/,/g, '_')
);

const isDvidSource = (source) => (
  source.toLowerCase().startsWith('dvid')
);

const falseMergesLayer = () => (
  {
    type: 'annotation',
    name: 'false merges',
    tool: 'annotatePoint',
    annotations: [],
    source: {
      url: 'local://annotations',
      transform: {
        // TODO: Query the dimensions, to support 4e-9.
        outputDimensions: {
          x: [8e-9, 'm'],
          y: [8e-9, 'm'],
          z: [8e-9, 'm'],
        },
      },
    },
  }
);

const falseMergePositions = () => {
  const falseMerges = [];
  const layer = getAnnotationLayer(null, 'false merges');
  if (layer) {
    const { localAnnotations } = layer;
    if (localAnnotations) {
      const { annotationMap } = localAnnotations;
      if (annotationMap) {
        annotationMap.forEach((annotation) => {
          const { point } = annotation;
          falseMerges.push([point[0], point[1], point[2]]);
        });
      }
    }
  }
  return falseMerges;
};

const annotationQueryBodyStatus = (response) => {
  if (response) {
    if (response.length > 0) {
      const { status } = response[0];
      return status;
    }
  }
  return 'unspecified';
};

const setupBodyStatusChoices = (dvidManager, setBodyStatusChoices) => {
  dvidManager.getAnnotationSchema().then(
    (schema) => {
      const { properties } = schema;
      const { status } = properties;
      const e = status.enum;
      setBodyStatusChoices(e);
    },
  );
};

const setupBodyStatus = (actions, bodyId, datasetName, datasets, getToken,
  projectUrl, setBodyStatus) => {
  const dataset = datasets.find((ds) => ds.name.startsWith(datasetName));
  const query = { bodyid: [bodyId] };
  queryBodyAnnotations(projectUrl, getToken(), dataset, query).then(
    (response) => {
      const status = annotationQueryBodyStatus(response);
      setBodyStatus(status);
    },
  ).catch((error) => {
    const message = `Failed to query bodies: ${error.message}.`;
    actions.addAlert({ severity: 'warning', message });
  });
};

const storeResults = (userEmail, selection, taskJson, result, taskStartTime,
  dvidMngr, assnMngr) => {
  const time = (new Date()).toISOString();

  // Copy the task JSON for the (unlikely) possibility that the next task starts
  // before this asynchronous code finishes.
  const taskJsonCopy = JSON.parse(JSON.stringify(taskJson));

  const taskEndTime = Date.now();
  const elapsedMs = taskEndTime - taskStartTime;
  let dvidLogValue = {
    'grayscale source': dvidMngr.grayscaleSourceURL(),
    'segmentation source': dvidMngr.segmentationSourceURL(),
    'DVID source': dvidMngr.dvidSourceURL(),
    [TASK_KEYS.BODY_ID]: taskJsonCopy[TASK_KEYS.BODY_ID],
    'selected body IDs': selection,
    'false merges': falseMergePositions(),
    result,
    time,
    user: userEmail,
    'time to complete (ms)': elapsedMs,
    client: CLIENT_INFO.info,
  };
  if (assnMngr.assignmentFile) {
    dvidLogValue = { ...dvidLogValue, assignment: assnMngr.assignmentFile };
  }

  // Make sure any extra keys from the input are carried over to the output.
  const omit = ['completed'];
  Object.keys(taskJsonCopy).forEach((key) => {
    if (!(key in dvidLogValue) && !omit.includes(key)) {
      dvidLogValue[key] = taskJsonCopy[key];
    }
  });

  const key = dvidLogKey(taskJsonCopy, userEmail);
  dvidMngr.postKeyValue(RESULTS_INSTANCE, key, dvidLogValue);
};


// Returns: completed
const restoreResults = (taskJson) => {
  const completed = !!taskJson.completed;
  return (completed);
};

//
// The React component for orphan linking.  Per the latest suggestions,
// it is a functional component using hooks to manage state and side effects.
// State shared with other components in the application is managed using
// Redux, accessed with the functions in the `actions` prop.

function OrphanLink(props) {
  const { actions, children, datasets } = props;
  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);
  const projectUrl = useSelector((state) => state.clio.get('projectUrl'), shallowEqual);
  const getToken = React.useCallback(() => user.getAuthResponse().id_token, [user]);

  const [dvidMngr] = React.useState(() => (new DvidManager()));
  const [dvidMngrDialogOpen, setDvidMngrDialogOpen] = React.useState(false);

  const [assnMngr] = React.useState(() => (new AssignmentManager()));
  const [assnMngrLoading, setAssnMngrLoading] = React.useState(false);

  const [segmentationLayerName, setSegmentationLayerName] = React.useState('');
  const [taskJson, setTaskJson] = React.useState(undefined);
  const [taskStartTime, setTaskStartTime] = React.useState(0);
  const [bodyId, setBodyId] = React.useState(undefined);
  const [extraBodyIds, setExtraBodyIds] = React.useState([]);
  const [promptToAddExtra, setPromptToAddExtra] = React.useState(true);
  const [initialPosition, setInitialPosition] = React.useState(undefined);
  const [initialOrientation, setInitialOrientation] = React.useState(undefined);
  const [initialScale, setInitialScale] = React.useState(undefined);
  const [normalScale, setNormalScale] = React.useState(100);
  const [completed, setCompleted] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [bodyIdIsSelected, setBodyIdIsSelected] = React.useState(true);
  const [colorAsMerged, setColorAsMerged] = React.useState(true);

  const [datasetName, setDatasetName] = React.useState(undefined);
  const [bodyStatusChoices, setBodyStatusChoices] = React.useState([]);
  const [bodyStatus, setBodyStatus] = React.useState(annotationQueryBodyStatus());

  // Not state, because changes occur during event processing and should not trigger rendering.
  const selection = React.useRef([]);
  const onVisibleChangedTimeoutPending = React.useRef(false);

  const theme = useTheme();
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      background: theme.palette.primary.main,
      fontFamily: theme.typography.fontFamily,
      fontSize: 'small',
      border: '0px',
    }),
    placeholder: () => ({
      color: '#000',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#000',
    }),
    menu: (provided) => ({
      ...provided,
      fontFamily: theme.typography.fontFamily,
      fontSize: 'small',
      color: '#000',
    }),
  };

  // Translate the old, NeuTu style of protocol.
  const translateJson = (oldJson) => {
    if (!(('metadata' in oldJson) && ('data' in oldJson))) {
      return (oldJson);
    }
    const grayscaleSourceURL = oldJson['grayscale source'];
    const segmentationSourceURL = oldJson['segmentation source'];
    const dvidSourceURL = oldJson['DVID source'];
    const { dataset, layers } = oldJson;
    const newJson = {
      'file type': 'Neu3 task list',
      'file version': 1,
      'grayscale source': grayscaleSourceURL,
      'segmentation source': segmentationSourceURL,
      'task list': oldJson.data.map((oldTask) => {
        const newTask = {
          'task type': 'orphan link',
          [TASK_KEYS.BODY_PT]: oldTask.location,
        };
        if (oldTask[TASK_KEYS.EXTRA_BODY_IDS]) {
          newTask[TASK_KEYS.EXTRA_BODY_IDS] = oldTask[TASK_KEYS.EXTRA_BODY_IDS];
        }
        return (newTask);
      }),
    };
    if (dvidSourceURL) {
      newJson['DVID source'] = dvidSourceURL;
    }
    if (dataset) {
      newJson.dataset = dataset;
    }
    if (layers) {
      newJson.layers = layers;
    }
    return newJson;
  };

  const setupAssn = React.useCallback(() => {
    const json = assnMngr.assignment;
    const name = json[TASK_KEYS.DATASET_NAME];
    setDatasetName(name);
    const dataset = datasets.find((ds) => ds.name.startsWith(name));

    const setViewer = () => {
      if (dataset) {
        const layers = makeLayersFromDataset(dataset, false);
        const custom = { layers };
        const viewerOptions = makeViewOptionsFromDataset(dataset, custom);
        actions.initViewer(viewerOptions);
      } else {
        actions.setViewerGrayscaleSource(dvidMngr.grayscaleSourceURL());
        const segmentationSource = {
          url: dvidMngr.segmentationSourceURL(),
          subsources: {
            default: true,
            meshes: true,
          },
          enableDefaultSubsources: false,
        };
        actions.setViewerSegmentationSource(segmentationSource);
        setSegmentationLayerName('segmentation');
      }

      // If the assignment contains custom layers, add them or replace normal layers
      // with matching names.
      if ('layers' in json) {
        const state = getNeuroglancerViewerState();
        if ('layers' in state) {
          const matches = (l1, l2) => {
            const re = new RegExp(l1.name);
            return re.test(l2.name);
          };
          json.layers.forEach((newLayer) => {
            const oldLayer = state.layers.find((layer) => matches(newLayer, layer));
            if (oldLayer) {
              /* eslint-disable-next-line no-param-reassign */
              newLayer.name = oldLayer.name;
            }
            actions.addViewerLayer(newLayer);
          });
        }
      }
    };

    let resolver;
    let grayscaleSource = json[TASK_KEYS.GRAYSCALE_SOURCE];
    let segmentationSource = json[TASK_KEYS.SEGMENTATION_SOURCE];

    if (dataset) {
      const grayscaleLayer = getMainImageLayer(dataset);
      grayscaleSource = grayscaleLayer && getLayerSourceUrl(grayscaleLayer);
      const segmentationLayer = getMergeableLayerFromDataset(dataset);
      if (segmentationLayer) {
        setSegmentationLayerName(segmentationLayer.name);
        segmentationSource = getLayerSourceUrl(segmentationLayer);
      }
    }
    if (grayscaleSource && segmentationSource
        && ((TASK_KEYS.DVID_SOURCE in json) || isDvidSource(segmentationSource))) {
      const dvidSource = json[TASK_KEYS.DVID_SOURCE] || '';
      dvidMngr.init(grayscaleSource, segmentationSource, dvidSource);
      setViewer();

      if (dataset) {
        setupBodyStatusChoices(dvidMngr, setBodyStatusChoices);
      }

      // This promise immediately calls the `.then(...)` code, as there is no dialog to wait for.
      return new Promise((resolve) => { resolve(); });
    }
    const onDvidInitialized = () => {
      setDvidMngrDialogOpen(false);
      setViewer();
      resolver();
    };
    dvidMngr.initForDialog(onDvidInitialized, 'Segmentation', grayscaleSource, segmentationSource);
    setDvidMngrDialogOpen(true);
    // This promise saves the `.then(...)` code so it can be can be called at the end of
    // `onDvidInitialized()`, above, when the sources dialog has been closed.
    return new Promise((resolve) => { resolver = resolve; });
  }, [actions, assnMngr, dvidMngr, datasets, setBodyStatusChoices]);

  const setupTask = React.useCallback(() => {
    // Clearing the task JSON prevents rapid UI activity from starting another task before
    // this one is done being set up.
    const taskJsonOld = taskJson;
    setTaskJson(undefined);

    const onError = (group) => (error) => { actions.addAlert({ group, message: error }); };
    const startTime = Date.now();
    setTaskStartTime(startTime);
    const json = assnMngr.taskJson();
    const bodyPt = bodyPoint(json);
    const userEmail = user.info.email;
    if (!bodyPt) {
      return new Promise((resolve) => { resolve(AssignmentManager.TASK_SKIP); });
    }
    return (
      getBodyId(bodyPt, dvidMngr, json, onError(1))
        .then((bodyIdFromPt) => (
          dvidMngr.getKeyValue(RESULTS_INSTANCE, dvidLogKey(json, userEmail), onError(3))
            .then((data) => [bodyIdFromPt, data])
        ))
        .then(([bodyIdFromPt, prevResult]) => {
          if ((bodyIdFromPt === DvidManager.NO_INTERNET)
            || (prevResult === DvidManager.NO_INTERNET)) {
            setTaskJson(taskJsonOld);
            return (AssignmentManager.TASK_RETRY);
          }
          if (!bodyIdFromPt) {
            storeResults(userEmail, [bodyIdFromPt], json, 'skip (missing body ID)', startTime, dvidMngr, assnMngr);
            return (AssignmentManager.TASK_SKIP);
          }
          if (prevResult) {
            json.completed = true;
            // If all tasks in the assignment are skipped, let `taskDocString` end up displaying
            // something better than "Loading..."
            setTaskJson(json);
            // Skip a task that has a stored result already.
            return (AssignmentManager.TASK_SKIP);
          }
          setExtraBodyIds(getExtraBodyIds(json, bodyIdFromPt));
          setPromptToAddExtra(true);
          const restoredCompleted = restoreResults(json);
          const { position, projectionOrientation } = cameraPose(bodyPt);
          cameraProjectionScale(bodyIdFromPt, projectionOrientation, json, dvidMngr)
            .then((scale) => {
              setBodyId(bodyIdFromPt);
              setBodyIdIsSelected(true);
              setNormalScale(scale);
              setInitialPosition(position);
              setInitialOrientation(projectionOrientation);
              setInitialScale(scale);
              setCompleted(restoredCompleted);

              selection.current = [bodyIdFromPt];

              actions.setViewerSegments([bodyIdFromPt]);
              actions.setViewerSegmentColors(bodyColors([bodyIdFromPt], colorAsMerged));
              actions.addViewerLayer(falseMergesLayer());
              actions.setViewerCrossSectionScale(0.4);
              actions.setViewerCameraPosition(position);
              actions.setViewerCameraProjectionOrientation(projectionOrientation);
              actions.setViewerCameraProjectionScale(scale);

              setTaskJson(json);
              if (datasetName) {
                setupBodyStatus(actions, bodyIdFromPt, datasetName, datasets, getToken,
                  projectUrl, setBodyStatus);
              }
            });
          return (AssignmentManager.TASK_OK);
        })
    );
  }, [actions, user, taskJson, selection, colorAsMerged, assnMngr, dvidMngr,
    datasets, datasetName, getToken, projectUrl, setBodyStatus]);

  const noTask = (taskJson === undefined);
  const prevDisabled = noTask || assnMngr.prevButtonDisabled();
  const nextDisabled = noTask || assnMngr.nextButtonDisabled();

  React.useEffect(() => {
    assnMngr.init(translateJson, setupAssn, setupTask, actions.addAlert);
  }, [assnMngr, setupAssn, setupTask, actions]);

  const handleLoadButton = () => {
    setAssnMngrLoading(true);
    const onLoadInteractionDone = () => setAssnMngrLoading(false);
    assnMngr.load(onLoadInteractionDone);
  };

  const resetForNewTask = () => {
    actions.setViewerCameraProjectionScale(normalScale);
  };

  const handleNextButton = () => {
    assnMngr.next();
    resetForNewTask();
  };

  const handlePrevButton = () => {
    assnMngr.prev();
    resetForNewTask();
  };

  const handleInitialView = () => {
    actions.setViewerCameraPosition(initialPosition);
    actions.setViewerCameraProjectionOrientation(initialOrientation);
    actions.setViewerCameraProjectionScale(initialScale);
  };

  const handleExtraButton = () => {
    if (promptToAddExtra) {
      selection.current = selection.current.concat(extraBodyIds);
    } else {
      const difference = [];
      selection.current.forEach((id) => {
        if (!extraBodyIds.includes(id)) {
          difference.push(id);
        }
      });
      selection.current = difference;
    }
    setPromptToAddExtra(!promptToAddExtra);
    actions.setViewerSegments(selection.current);
    const segmentQuery = selection.current.reduce((a, v) => (a ? `${a}, ${v}` : v), null);
    actions.setViewerSegmentQuery(segmentQuery);
  };

  const handleTaskCompleted = (isCompleted) => {
    setCompleted(isCompleted);
    taskJson.completed = isCompleted;
    if (isCompleted) {
      const userEmail = user.info.email;
      storeResults(userEmail, selection.current, taskJson, 'merge', taskStartTime,
        dvidMngr, assnMngr);
    }
  };

  const handleColorAsMergedCheckbox = (event) => {
    actions.syncViewer();
    setColorAsMerged(event.target.checked);
  };

  const handleCompletedCheckbox = (event) => {
    handleTaskCompleted(event.target.checked);
  };

  const handleHelpOpen = () => { setHelpOpen(true); };
  const handleHelpClose = () => { setHelpOpen(false); };

  const handleKeyPress = (event) => {
    // Ignore keyboard shortcuts when a Neuroglancer text input has focus.
    if (activeElementNeedsKeypress()) {
      return;
    }

    if (!noTask) {
      if (event.key === keyBindings.protocolNextTask.key) {
        if (!nextDisabled) {
          handleNextButton();
        }
      } else if (event.key === keyBindings.protocolPrevTask.key) {
        if (!prevDisabled) {
          handlePrevButton();
        }
      } else if ((event.key === keyBindings.protocolCompletedAndNextTask1.key)
        || (event.key === keyBindings.protocolCompletedAndNextTask2.key)) {
        handleTaskCompleted(true);
        if (!nextDisabled) {
          handleNextButton();
        }
      } else if (event.key === keyBindings.orphanLinkInitialView.key) {
        handleInitialView();
      }
    }
  };

  // Neuroglancer's notion of "visible" corresponds to other applications' notion of "selected".
  const onVisibleChanged = (segments, layer) => {
    if (layer.name === segmentationLayerName) {
      const selectionStrings = segments.toJSON();
      selection.current = selectionStrings.map((s) => parseInt(s, 10));
      setBodyIdIsSelected(selection.current.includes(bodyId));
      // The newly visible segments need to be colored as merged.  But Neuroglancer seems
      // to change the visible segments in several steps, and issuing the action to change
      // the segment colors can trigger a cascade of further visiblity changes that end up with
      // the wrong segments visible.  So postpone the color change until control returns to the
      // event loop, which will be after all of Neuroglancer's changes.
      if (!onVisibleChangedTimeoutPending.current && taskJson) {
        onVisibleChangedTimeoutPending.current = true;
        setTimeout(() => {
          const payload = {
            layerName: layer.name,
            segmentColors: bodyColors(selection.current, colorAsMerged),
          };
          actions.setViewerSegmentColors(payload);
          actions.setViewerSegmentColors(payload);
          onVisibleChangedTimeoutPending.current = false;
        }, 0);
      }
    }
  };

  const handleBodyStatusChange = (event) => {
    const { value } = event;
    const newAnnotation = { bodyid: bodyId, status: value };
    const dataset = datasets.find((ds) => ds.name.startsWith(datasetName));
    updateBodyAnnotation(projectUrl, getToken(), user, dataset, newAnnotation);
    setBodyStatus(value);
  };

  const eventBindingsToUpdate = Object.entries(keyBindings).map((e) => [`key${e[1].key}`, `control+key${e[1].key}`]);

  // Add `onVisibleChanged` to the props of the child, which is a react-neuroglancer viewer.
  const childrenWithMoreProps = React.Children.map(children, (child) => (
    React.cloneElement(child, { eventBindingsToUpdate, onVisibleChanged }, null)
  ));

  const noExtra = (extraBodyIds.length === 0);

  const enableCompleted = bodyIdIsSelected;
  let tooltip = '';
  if (!bodyIdIsSelected) {
    tooltip += 'select the task\'s original body';
  }
  tooltip = `To enable "Completed": ${tooltip}`;

  const bodyStatusOptions = bodyStatusChoices.map((c) => ({ value: c, label: c }));

  return (
    <div
      className="orphan-link-container"
      tabIndex={0}
      onKeyPress={handleKeyPress}
    >
      <div className="orphan-link-control-row">
        <ButtonGroup variant="contained" color="primary" size="small">
          <Button color="primary" variant="contained" onClick={handleLoadButton}>
            Load
          </Button>
          <Button color="primary" variant="contained" onClick={handlePrevButton} disabled={prevDisabled}>
            Prev
          </Button>
          <Button color="primary" variant="contained" onClick={handleNextButton} disabled={nextDisabled}>
            Next
          </Button>
        </ButtonGroup>
        <Tooltip title={taskDocTooltip(taskJson, assnMngr)}>
          <Typography color="inherit">
            {taskDocString(taskJson, assnMngr)}
          </Typography>
        </Tooltip>
        &nbsp; &nbsp;
        <FormGroup row disabled={noTask}>
          <FormControlLabel
            label="Color as merged"
            control={(
              <Checkbox
                checked={colorAsMerged}
                onChange={handleColorAsMergedCheckbox}
                name="colorAsMerged"
                style={{ paddingRight: 0, marginRight: 0 }}
              />
            )}
          />
          <Button color="primary" variant="contained" onClick={handleExtraButton} disabled={noTask || noExtra}>
            {promptToAddExtra ? 'Suggest Extra' : 'Unsuggest Extra'}
          </Button>
          <Tooltip title={(noTask || enableCompleted) ? '' : tooltip}>
            <FormControlLabel
              label="Completed"
              control={(
                <Checkbox
                  disabled={!enableCompleted}
                  checked={completed}
                  onChange={handleCompletedCheckbox}
                  name="completed"
                  style={{ paddingRight: 0, marginRight: 0 }}
                />
              )}
            />
          </Tooltip>
        </FormGroup>
        <Select
          className="orphan-link-select"
          styles={selectStyles}
          onChange={handleBodyStatusChange}
          value={bodyStatus}
          placeholder={`Body status: ${bodyStatus}`}
          options={bodyStatusOptions}
        />

        <IconButton onClick={handleHelpOpen}>
          <HelpIcon />
        </IconButton>
        <ThemeProvider theme={dialogTheme}>
          <DvidManagerDialog manager={dvidMngr} open={dvidMngrDialogOpen} />
          <AssignmentManagerDialog manager={assnMngr} open={assnMngrLoading} />
          <ProtocolHelp
            title="Orphan Link Help"
            keyBindings={keyBindings}
            open={helpOpen}
            onClose={handleHelpClose}
          />
        </ThemeProvider>
      </div>
      <div
        className="ng-container"
        onContextMenu={(event) => { event.preventDefault(); }}
      >
        {childrenWithMoreProps}
      </div>
    </div>
  );
}

OrphanLink.propTypes = {
  actions: PropTypes.object.isRequired,
  children: PropTypes.object.isRequired,
  /* eslint-disable-next-line react/forbid-prop-types */
  datasets: PropTypes.array.isRequired,
};

export default OrphanLink;
