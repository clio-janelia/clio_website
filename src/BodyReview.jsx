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
import { AssignmentManager, AssignmentManagerDialog } from './AssignmentManager';
import ClientInfo from './ClientInfo';
import { DvidManager, DvidManagerDialog } from './DvidManager';
import './BodyReview.css';
import ProtocolHelp from './ProtocolHelp';
import { getLayerSourceUrl } from './utils/neuroglancer';

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

const ASSIGNMENT_KEYS = Object.freeze({
  DVID_SOURCE: 'DVID source',
  LAYERS: 'layers',
});

const TASK_KEYS = Object.freeze({
  GROUPS: 'layers',
  GROUP_LAYER: 'name',
  GROUP_BODY_IDS: 'segments',

  // Optional keys, needed if the segmentation source does not support DVID commands.
  BBOX: 'default bounding box',
});

// https://maketintsandshades.com
// From 50% below to 40% above.
const SHADED_BODY_COLORS = Object.freeze([
  // orange #a53600
  ['#531b00', '#632000', '#732600', '#842b00', '#953100', '#a53600', '#ae4a1a', '#b75e33', '#c0724d', '#c98666'],
  // green #348e53
  ['#1a472a', '#1f5532', '#24633a', '#2a7242', '#2f804b', '#348e53', '#489964', '#5da575', '#71b087', '#85bb98'],
  // blue #0072b2
  ['#003959', '#00446b', '#00507d', '#005b8e', '#0067a0', '#0072b2', '#1a80ba', '#338ec1', '#4d9cc9', '#66aad1'],
  // pink #b32db5
  ['#5a175b', '#6b1b6d', '#7d1f7f', '#8f2491', '#a129a3', '#b32db5', '#bb42bc', '#c257c4', '#ca6ccb', '#d181d3'],
  // yellow #908827
  ['#484414', '#565217', '#655f1b', '#736d1f', '#827a23', '#908827', '#9b943d', '#a6a052', '#b1ac68', '#bcb87d'],
  // dark blue #053cff
  ['#031e80', '#032499', '#042ab3', '#0430cc', '#0536e6', '#053cff', '#1e50ff', '#3763ff', '#5077ff', '#698aff'],
]);

const SHADED_BODY_COLOR_INDICES = Object.freeze([
  [5],
  [3, 7],
  [2, 5, 8],
  [1, 3, 6, 8],
  [1, 3, 5, 7, 9],
  [0, 2, 4, 5, 7, 9],
  [0, 2, 3, 5, 6, 7, 9],
  [0, 2, 3, 4, 5, 6, 7, 9],
  [0, 1, 2, 3, 4, 5, 7, 8, 9],
  // 10 or more: just cycle through all indices
]);

const BODY_COLORS = Object.freeze([
  [
    '#f58231', // orange
    '#e6194b', // red
    '#ffe119', // yellow
    '#fabed4', // pink
    '#ffd8b1', // apricot
    '#9a6324', // brown
  ],
  [
    '#3cb44b', // green
    '#bfef45', // lime
    '#aaffc3', // mint
    '#808000', // olive
    '#469990', // teal
    '#42d4f4', // cyan
  ],
  [
    '#4363d8', // blue
    '#000075', // navy
    '#911eb4', // purple
    '#f032e6', // magenta
    '#dcbeff', // lavender
    '#800000', // maroon
    '#fffac8', // beige
  ],
]);

const COMPLETION_CHOICES = Object.freeze(['Complete', 'Partial', 'Skip']);

const RESULTS_INSTANCE = 'body_review_results';

const CLIENT_INFO = new ClientInfo();

//
// Functions that can be factored out of the React component (because they don't use hooks)

const getBbox = (bodyId, dvidMngr, taskJson) => (
  dvidMngr.getSparseVolSize(bodyId, () => {})
    .then((bboxData) => {
      let data = bboxData;
      if (!data) {
        data = taskJson[TASK_KEYS.TASK_BBOX];
      }
      if (!data) {
        // Lacking any true bounding box, return fixed values that will make the
        // scale be 10000, a value which is plausible based on some hemibrain data.
        data = { minvoxel: [0, 0, 0], maxvoxel: [0, 10000, 0] };
      }
      return (data);
    })
);

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

const taskSummaryString = (taskJson) => {
  if (taskJson) {
    const idsStr = (ids) => ids.sort().map((id) => id.toString()).join('-');
    const groups = taskJson[TASK_KEYS.GROUPS];
    const items = groups.map((g) => `${g[TASK_KEYS.GROUP_LAYER]}[${idsStr(g[TASK_KEYS.GROUP_BODY_IDS])}]`);
    const result = items.join('_');
    return result;
  }
  return '';
};

const taskDocTooltip = (taskJson, assnMngr) => {
  const summary = taskSummaryString(taskJson);
  return `${assnMngr.assignmentFile} ${summary}`;
};

const validateTask = (json, onError) => {
  if (!(TASK_KEYS.GROUPS in json)) {
    onError(`Invalid task: missing ${TASK_KEYS.GROUPS}`);
    return false;
  }
  if (!Array.isArray(json[TASK_KEYS.GROUPS])) {
    onError(`Invalid task: ${TASK_KEYS.GROUPS} is not an array`);
  }
  if (json[TASK_KEYS.GROUPS].length === 0) {
    onError(`Invalid task: ${TASK_KEYS.GROUPS} is empty`);
  }
  const groups = json[TASK_KEYS.GROUPS];
  const every = groups.every((group, i) => {
    if (!(TASK_KEYS.GROUP_LAYER in group)) {
      onError(`Invalid task: group ${i} is missing key '${TASK_KEYS.GROUP_LAYER}`);
      return false;
    }
    if (!(TASK_KEYS.GROUP_BODY_IDS in group)) {
      onError(`Invalid task: group ${i} is missing key '${TASK_KEYS.GROUP_BODY_IDS}`);
      return false;
    }
    const ids = group[TASK_KEYS.GROUP_BODY_IDS];
    if (!Array.isArray(ids)) {
      onError(`Invalid task: group ${i}'s '${TASK_KEYS.GROUP_BODY_IDS}' is not an array`);
      return false;
    }
    if (ids.length === 0) {
      onError(`Invalid task: group ${i}'s '${TASK_KEYS.GROUP_BODY_IDS}' is empty`);
      return false;
    }
    return true;
  });
  return every;
};

const cameraPose = (bbox) => {
  const position = [
    (bbox.minvoxel[0] + bbox.maxvoxel[0]) / 2,
    (bbox.minvoxel[1] + bbox.maxvoxel[1]) / 2,
    (bbox.minvoxel[2] + bbox.maxvoxel[2]) / 2,
  ];
  // Viewing direction is down the Z axis.
  const angle = 0;
  // Convert that angle and the rotation axis (the Y axis) into a quaternion.
  const c = Math.cos(angle / 2);
  const s = Math.sin(angle / 2);
  const projectionOrientation = [0, s, 0, c];
  return ({ position, projectionOrientation });
};

const cameraProjectionScale = (bbox, orientation) => {
  // The heuristics here consider the sizes of bounding box dimensions (sides)
  // as seen with the current camera orientation.  This orientation is a rotation
  // around the Y axis.  A bounding box X dimension apears scaled by the cosine of
  // the camera angle, and the Z by the sine.  The Y dimension is unscaled.
  const angle = Math.acos(orientation[3]) * 2;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  // For the normal scale, use the body's bounding box, and pick the
  // scaled dimension that is bigger.
  const dims = [
    bbox.maxvoxel[0] - bbox.minvoxel[0],
    bbox.maxvoxel[1] - bbox.minvoxel[1],
    bbox.maxvoxel[2] - bbox.minvoxel[2]];
  const visibleX = Math.abs(c * dims[0]);
  const visibleZ = Math.abs(s * dims[2]);
  const scale = Math.max(visibleX, dims[1], visibleZ);
  return (scale);
};

const dvidLogKey = (taskJson, userEmail) => {
  const summary = taskSummaryString(taskJson);
  return `${summary}_${userEmail}`.replace(/ /g, '_');
};

const isDvidSource = (source) => (
  source.toLowerCase().startsWith('dvid')
);

const getDvidLayer = (layers, type) => (
  layers.find((layer) => isDvidSource(getLayerSourceUrl(layer)) && layer.type === type)
);

const getTaskGroupBodyIds = (taskJson, name = undefined) => {
  const groups = taskJson[TASK_KEYS.GROUPS];
  if (name) {
    const group = groups.find((g) => g[TASK_KEYS.GROUP_LAYER] === name);
    return group ? group[TASK_KEYS.GROUP_BODY_IDS] : [];
  }
  const result = groups.reduce((a, g) => (
    { ...a, [g[TASK_KEYS.GROUP_LAYER]]: g[TASK_KEYS.GROUP_BODY_IDS] }
  ), {});
  return result;
};

const makeSegmentColorsShaded = (iGroup, segments) => {
  const result = {};
  const color = SHADED_BODY_COLORS[iGroup % SHADED_BODY_COLORS.length];
  if (segments.length < color.length) {
    const indices = SHADED_BODY_COLOR_INDICES[segments.length];
    segments.forEach((s, i) => { result[s] = color[indices[i]]; });
  } else {
    segments.forEach((s, i) => { result[s] = color[i % color.length]; });
  }
  return result;
};

const makeSegmentColors = (iGroup, segments) => {
  const result = {};
  const color = BODY_COLORS[iGroup % SHADED_BODY_COLORS.length];
  segments.forEach((s, i) => { result[s] = color[i % color.length]; });
  return result;
};

const falseMergesLayer = () => (
  {
    type: 'annotation',
    name: 'false merges',
    tool: 'annotatePoint',
    tab: 'annotations',
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

const storeResults = (userEmail, taskJson, taskStartTime, matches, completionStatus,
  dvidMngr, assnMngr) => {
  const time = (new Date()).toISOString();

  // Copy the task JSON for the (unlikely) possibility that the next task starts
  // before this asynchronous code finishes.
  const taskJsonCopy = JSON.parse(JSON.stringify(taskJson));

  // Remember the form: matches[matchesIndex][layerName] = [segment0, segment1, ...]

  const ngState = getNeuroglancerViewerState();
  const visible = ngState.layers.reduce((a, l) => (
    (!('visible' in l) || l.visible) ? [...a, l.name] : [...a]
  ), []);
  // Remove layers that the user made not visible.
  const matches2 = matches.map((m) => (
    Object.fromEntries(
      Object.entries(m).filter((e) => visible.includes(e[0])),
    )
  ));

  // Remove matches entries with no IDs selected on any layer.
  const matches3 = matches2.filter((m) => Object.keys(m).every((k) => m[k].length > 0));

  const taskEndTime = Date.now();
  const elapsedMs = taskEndTime - taskStartTime;
  let dvidLogValue = {
    completionStatus,
    matches: matches3,
    'false merges': falseMergePositions(),
    time,
    user: userEmail,
    'time to complete (ms)': elapsedMs,
    client: CLIENT_INFO.info,
  };
  if (assnMngr.assignmentFile) {
    dvidLogValue = { ...dvidLogValue, assignment: assnMngr.assignmentFile };
  }

  // Make sure any keys from the input are carried over to the output.
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
// The React component for body review.  Per the latest suggestions,
// it is a functional component using hooks to manage state and side effects.
// State shared with other components in the application is managed using
// Redux, accessed with the functions in the `actions` prop.

function BodyReview(props) {
  const { actions, children } = props;
  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);

  const [dvidMngr] = React.useState(() => (new DvidManager()));
  const [dvidMngrDialogOpen, setDvidMngrDialogOpen] = React.useState(false);

  const [assnMngr] = React.useState(() => (new AssignmentManager()));
  const [assnMngrLoading, setAssnMngrLoading] = React.useState(false);

  const [dvidSegmentationLayerName, setDvidSegmentationLayerName] = React.useState('');

  const [taskJson, setTaskJson] = React.useState(undefined);
  const [taskStartTime, setTaskStartTime] = React.useState(0);

  const [initialPosition, setInitialPosition] = React.useState(undefined);
  const [initialOrientation, setInitialOrientation] = React.useState(undefined);
  const [initialScale, setInitialScale] = React.useState(undefined);
  const [normalScale, setNormalScale] = React.useState(100);

  const [groupToIds, setGroupToIds] = React.useState({});

  const [matches, setMatches] = React.useState([]);
  // TODO: If we decide it's useful to ask the user to find multiple groups of matches,
  // then add UI to change this index, and add new elements to the matches array.
  const [matchesIndex, setMatchesIndex] = React.useState(0);

  const [completionStatus, setCompletionStatus] = React.useState(COMPLETION_CHOICES[0]);

  /* eslint-disable-next-line no-unused-vars */
  const [useShadedColors, setUseShadedColors] = React.useState(false);

  const [completed, setCompleted] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);

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

  const makeViewOptions = (layers) => {
    const dimensions = {
      x: [8e-9, 'm'],
      y: [8e-9, 'm'],
      z: [8e-9, 'm'],
    };
    return {
      showSlices: false,
      dimensions,
      layout: '3d',
      layers,
    };
  };

  const setupAssn = React.useCallback(() => {
    const json = assnMngr.assignment;
    const setViewer = () => {
      if (!('layers' in json)) {
        actions.addAlert({ severity: 'warning', message: 'Invalid assignment: no "layers"' });
        return;
      }
      const viewerOptions = makeViewOptions(json.layers);
      actions.initViewer(viewerOptions);
    };

    const dvidLayer = getDvidLayer(json.layers, 'segmentation');
    setDvidSegmentationLayerName(dvidLayer.name);
    const dvidSegmentationSource = getLayerSourceUrl(dvidLayer);

    const SOURCE_NOT_NEEDED = undefined;
    let resolver;
    if (ASSIGNMENT_KEYS.DVID_SOURCE in json) {
      const dvidSource = json[ASSIGNMENT_KEYS.DVID_SOURCE] || '';
      dvidMngr.init(SOURCE_NOT_NEEDED, dvidSegmentationSource, dvidSource);
      setViewer();

      // This promise immediately calls the `.then(...)` code, as there is no dialog to wait for.
      return new Promise((resolve) => { resolve(); });
    }
    const onDvidInitialized = () => {
      setDvidMngrDialogOpen(false);
      setViewer();
      resolver();
    };
    dvidMngr.initForDialog(onDvidInitialized, 'Segmentation', SOURCE_NOT_NEEDED, SOURCE_NOT_NEEDED);
    setDvidMngrDialogOpen(true);
    // This promise saves the `.then(...)` code so it can be can be called at the end of
    // `onDvidInitialized()`, above, when the sources dialog has been closed.
    return new Promise((resolve) => { resolver = resolve; });
  }, [actions, assnMngr, dvidMngr]);

  const setupTask = React.useCallback(() => {
    // Clearing the task JSON prevents rapid UI activity from starting another task before
    // this one is done being set up.
    const taskJsonOld = taskJson;
    setTaskJson(undefined);

    const onError = (group) => (error) => { actions.addAlert({ group, message: error }); };
    const startTime = Date.now();
    setTaskStartTime(startTime);
    const json = assnMngr.taskJson();
    const userEmail = user.info.email;

    if (!validateTask(json, onError(1))) {
      return (AssignmentManager.TASK_SKIP);
    }

    const dvidGroup = json[TASK_KEYS.GROUPS].find((l) => l.name === dvidSegmentationLayerName);
    const dvidBodyId = dvidGroup[TASK_KEYS.GROUP_BODY_IDS][0];

    return (
      getBbox(dvidBodyId, dvidMngr, json, onError(1))
        .then((bbox) => (
          dvidMngr.getKeyValue(RESULTS_INSTANCE, dvidLogKey(json, userEmail), onError(3))
            .then((data) => [bbox, data])
        ))
        .then(([bbox, prevResult]) => {
          if ((bbox === DvidManager.NO_INTERNET)
            || (prevResult === DvidManager.NO_INTERNET)) {
            setTaskJson(taskJsonOld);
            return (AssignmentManager.TASK_RETRY);
          }
          if (!bbox) {
            const completionStatusSkip = COMPLETION_CHOICES[2];
            storeResults(userEmail, {}, json, startTime, 'skip (cannot compute bounding box)', completionStatusSkip, dvidMngr, assnMngr);
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
          const restoredCompleted = restoreResults(json);
          const { position, projectionOrientation } = cameraPose(bbox);
          const scale = cameraProjectionScale(bbox, projectionOrientation);
          setNormalScale(scale);
          setInitialPosition(position);
          setInitialOrientation(projectionOrientation);
          setInitialScale(scale);
          setCompleted(restoredCompleted);

          const gToIds = getTaskGroupBodyIds(json);
          setGroupToIds(gToIds);
          const m = getTaskGroupBodyIds(json);
          setMatches([m]);
          setMatchesIndex(0);

          Object.keys(gToIds).forEach((group, i) => {
            const ids = gToIds[group];
            actions.setViewerSegments({ layerName: group, segments: ids });
            const idsJoined = ids.join(', ');
            actions.setViewerSegmentQuery({ layerName: group, segments: idsJoined });
            const c = useShadedColors ? makeSegmentColorsShaded(i, ids) : makeSegmentColors(i, ids);
            actions.setViewerSegmentColors({ layerName: group, segmentColors: c });
          });

          actions.addViewerLayer(falseMergesLayer());
          actions.setViewerCrossSectionScale(0.4);
          actions.setViewerCameraPosition(position);
          actions.setViewerCameraProjectionOrientation(projectionOrientation);
          actions.setViewerCameraProjectionScale(scale);

          setTaskJson(json);
          return (AssignmentManager.TASK_OK);
        })
    );
  }, [actions, user, taskJson, assnMngr, dvidMngr, dvidSegmentationLayerName, useShadedColors]);

  const noTask = (taskJson === undefined);
  const prevDisabled = noTask || assnMngr.prevButtonDisabled();
  const nextDisabled = noTask || assnMngr.nextButtonDisabled();

  React.useEffect(() => {
    assnMngr.init(undefined, setupAssn, setupTask, actions.addAlert);
  }, [assnMngr, setupAssn, setupTask, actions]);

  const handleLoadButton = () => {
    setAssnMngrLoading(true);
    const onLoadInteractionDone = () => setAssnMngrLoading(false);
    assnMngr.load(onLoadInteractionDone);
  };

  const resetForNewTask = () => {
    actions.setViewerCameraProjectionScale(normalScale);
    setCompletionStatus(COMPLETION_CHOICES[0]);
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

  const handleTaskCompleted = (isCompleted) => {
    setCompleted(isCompleted);
    taskJson.completed = isCompleted;
    if (isCompleted) {
      const userEmail = user.info.email;
      storeResults(userEmail, taskJson, taskStartTime, matches, completionStatus,
        dvidMngr, assnMngr);
    }
  };

  const handleResetLayer = async () => {
    const ngState = getNeuroglancerViewerState();
    const selectedLayer = ('selectedLayer' in ngState) ? ngState.selectedLayer : undefined;
    if (selectedLayer) {
      const { layer } = selectedLayer;
      if (layer in groupToIds) {
        const ids = groupToIds[layer];
        actions.setViewerSegments({ layerName: layer, segments: ids });
        const idsJoined = ids.join(', ');
        actions.setViewerSegmentQuery({ layerName: layer, segments: idsJoined });
      }
    } else {
      Object.keys(groupToIds).forEach((layer) => {
        const ids = groupToIds[layer];
        actions.setViewerSegments({ layerName: layer, segments: ids });
        const idsJoined = ids.join(', ');
        actions.setViewerSegmentQuery({ layerName: layer, segments: idsJoined });
      });
    }
  };

  const handleCompletedCheckbox = (event) => {
    // Synchronizing the Redux state and the Neuroglancer view state is necessary to prevent
    // Neuroglancer from resetting the visible segments.
    actions.syncViewer();

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
    const { name } = layer;
    if (name in groupToIds) {
      const newMatches = matches;
      if (!(name in matches[matchesIndex])) {
        newMatches[matchesIndex][name] = [];
      }
      const segmentStrs = segments.toJSON();
      newMatches[matchesIndex][name] = segmentStrs;
      setMatches(newMatches);
    }
  };

  const handleCompletionStatusChange = (event) => {
    const { value } = event;
    setCompletionStatus(value);
  };

  const eventBindingsToUpdate = Object.entries(keyBindings).map((e) => [`key${e[1].key}`, `control+key${e[1].key}`]);

  // Add `onVisibleChanged` to the props of the child, which is a react-neuroglancer viewer.
  const childrenWithMoreProps = React.Children.map(children, (child) => (
    React.cloneElement(child, { eventBindingsToUpdate, onVisibleChanged }, null)
  ));

  const tooltip = '';
  const enableCompleted = true;

  const completionStatusOptions = COMPLETION_CHOICES.map((c) => ({ value: c, label: c }));

  return (
    <div
      className="body-review-container"
      tabIndex={0}
      onKeyPress={handleKeyPress}
    >
      <div className="body-review-control-row">
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
          <Button color="primary" variant="contained" onClick={handleResetLayer} disabled={noTask}>
            Reset layer
          </Button>

          &nbsp;

          <Select
            className="body-review-select"
            styles={selectStyles}
            onChange={handleCompletionStatusChange}
            value={completionStatus}
            placeholder={`Completion status: ${completionStatus}`}
            options={completionStatusOptions}
          />

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

        <IconButton onClick={handleHelpOpen}>
          <HelpIcon />
        </IconButton>
        <ThemeProvider theme={dialogTheme}>
          <DvidManagerDialog manager={dvidMngr} open={dvidMngrDialogOpen} />
          <AssignmentManagerDialog manager={assnMngr} open={assnMngrLoading} />
          <ProtocolHelp
            title="Body Review Help"
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

BodyReview.propTypes = {
  actions: PropTypes.object.isRequired,
  children: PropTypes.object.isRequired,
};

export default BodyReview;
