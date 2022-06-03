import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Checkbox from '@material-ui/core/Checkbox';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { getAnnotationLayer, getNeuroglancerViewerState } from '@janelia-flyem/react-neuroglancer';
import HelpIcon from '@material-ui/icons/Help';
import IconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { createMuiTheme, withStyles } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import { vec2 } from 'gl-matrix';

import activeElementNeedsKeypress from './utils/events';
import { AssignmentManager, AssignmentManagerDialog } from './AssignmentManager';
import ClientInfo from './ClientInfo';
import { DvidManager, DvidManagerDialog } from './DvidManager';
import './FocusedProofreading.css';
import ProtocolHelp from './ProtocolHelp';

const styles = {
  window: {
    width: '90%',
    margin: 'auto',
    height: '500px',
  },
  textField: {
    width: '50%',
  },
  inputForm: {
    margin: '1em',
  },
};

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
  focusedProofreadingCycleResults: { key: 'v', help: 'Cycle through results' },
  focusedProofreadingToggleBirdsEyeView: { key: 'b', help: "Toggle between normal and bird's eye views" },
  focusedProofreadingInitialView: { key: 'i', help: "Use task's initial view" },
};

//
// Constants

const TASK_KEYS = Object.freeze({
  GRAYSCALE_SOURCE: 'grayscale source',
  SEGMENTATION_SOURCE: 'segmentation source',
  DVID_SOURCE: 'DVID source',
  BODY_PT1: 'body point 1',
  BODY_PT2: 'body point 2',
  // Optional keys, needed if the segmentation source does not support DVID commands.
  BODY_ID1: 'default body ID 1',
  BODY_ID2: 'default body ID 2',
  BBOX1: 'default bounding box 1',
  BBOX2: 'default bounding box 2',
  EXTRA_BODY_IDS: 'extra body IDs',
});

const RESULTS = Object.freeze({
  DONT_MERGE: 'dontMerge',
  MERGE: 'merge',
  MERGE_EXTRA: 'mergeExtra',
  MERGE_LATER: 'mergeLater',
  DONT_KNOW: 'dontKnow',
});

const RESULT_LABELS = Object.freeze({
  DONT_MERGE: "Don't Merge",
  MERGE: 'Merge',
  MERGE_EXTRA: 'Merge Extra',
  MERGE_LATER: 'Merge Later',
  DONT_KNOW: "Don't Know",
});

const RESULT_CYCLES_NEXT = Object.freeze({
  [RESULTS.DONT_MERGE]: RESULTS.MERGE,
  [RESULTS.MERGE]: RESULTS.MERGE_EXTRA,
  [RESULTS.MERGE_EXTRA]: RESULTS.DONT_KNOW,
  [RESULTS.DONT_KNOW]: RESULTS.DONT_MERGE,
});

// Green
const COLOR_PRIMARY_BODY = '#348E53';
// Mustard yellow
const COLOR_OTHER_BODY = '#908827';

const CLIENT_INFO = new ClientInfo();

//
// Functions that can be factored out of the React component (because they don't use hooks)

const bodyPoints = (taskJson) => {
  if ((TASK_KEYS.BODY_PT1 in taskJson) && (TASK_KEYS.BODY_PT2 in taskJson)) {
    return ([taskJson[TASK_KEYS.BODY_PT1], taskJson[TASK_KEYS.BODY_PT2]]);
  }
  return (undefined);
};

const getBodyId = (bodyPt, dvidMngr, taskJson, which, onError) => {
  let error;
  return (
    dvidMngr.getBodyId(bodyPt, (err) => { error = err; })
      .then((bodyId) => {
        let id = bodyId;
        if (!id) {
          const key = (which === 1) ? TASK_KEYS.BODY_ID1 : TASK_KEYS.BODY_ID2;
          id = taskJson[key];
        }
        if (!id) {
          onError(error);
        }
        return (id);
      })
  );
};

const getBbox = (bodyId, dvidMngr, taskJson, which) => (
  dvidMngr.getSparseVolSize(bodyId, () => {})
    .then((bboxData) => {
      let data = bboxData;
      if (!data) {
        const key = (which === 1) ? TASK_KEYS.BBOX1 : TASK_KEYS.BBOX2;
        data = taskJson[key];
      }
      if (!data) {
        // Lacking any true bounding box, return fixed values that will make the
        // normal scale be 100, and the bird's eye scale be 10000, values which
        // are plausible based on some hemibrain data.
        if (which === 1) {
          data = { minvoxel: [0, 0, 0], maxvoxel: [0, 200, 0] };
        } else {
          data = { minvoxel: [0, 0, 0], maxvoxel: [0, 10000, 0] };
        }
      }
      return (data);
    })
);

const getExtraBodyIds = (taskJson, bodyIds) => {
  if (TASK_KEYS.EXTRA_BODY_IDS in taskJson) {
    const extra = taskJson[TASK_KEYS.EXTRA_BODY_IDS];
    const result = extra.filter((id) => !bodyIds.includes(id));
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
  taskJson ? `${assnMngr.assignmentFile} [${taskJson[TASK_KEYS.BODY_PT1]}] + [${taskJson[TASK_KEYS.BODY_PT2]}]` : ''
);

const bodyColors = (bodyIds, selection, result) => {
  if (result === RESULTS.MERGE) {
    return ({
      [bodyIds[0]]: COLOR_PRIMARY_BODY,
      [bodyIds[1]]: COLOR_PRIMARY_BODY,
    });
  }
  if (result === RESULTS.MERGE_EXTRA) {
    return (selection.reduce((a, c) => ({ ...a, [c]: COLOR_PRIMARY_BODY }), {}));
  }
  return ({
    [bodyIds[0]]: COLOR_PRIMARY_BODY,
    [bodyIds[1]]: COLOR_OTHER_BODY,
  });
};

const cameraPose = (bodyPts) => {
  const position = [
    (bodyPts[0][0] + bodyPts[1][0]) / 2,
    (bodyPts[0][1] + bodyPts[1][1]) / 2,
    (bodyPts[0][2] + bodyPts[1][2]) / 2,
  ];

  // The vector between the points, projected onto the X-Z plane (since Y is up)...
  const betweenPts = vec2.fromValues(bodyPts[0][0] - bodyPts[1][0], bodyPts[0][2] - bodyPts[1][2]);
  // ...should be perpendicular to the camera direction vector.
  const cameraDir = vec2.create();
  vec2.rotate(cameraDir, betweenPts, vec2.fromValues(0, 0), Math.PI / 2);
  // So the camera rotation angle is the angle between that camera direction vector and
  // the X axis.
  const angle = vec2.angle(cameraDir, vec2.fromValues(0, 1));
  // Convert that angle and the rotation axis (the Y axis) into a quaternion.
  const c = Math.cos(angle / 2);
  const s = Math.sin(angle / 2);
  const projectionOrientation = [0, s, 0, c];

  return ({ position, projectionOrientation });
};

const cameraProjectionScale = (bodyIds, orientation, taskJson, dvidMngr) => {
  // TODO: Make `onError` an argument, for error handling specific to the 'get' calls here.
  const onError = (err) => {
    console.error('Failed to get body size: ', err);
  };
  return (
    getBbox(bodyIds[0], dvidMngr, taskJson, 1, onError)
      .then((data0) => (
        getBbox(bodyIds[1], dvidMngr, taskJson, 2, onError).then((data1) => ([data0, data1]))
      ))
      .then(([data0, data1]) => {
        // The heuristics here consider the sizes of bounding box dimensions (sides)
        // as seen with the current camera orientation.  This orientation is a rotation
        // around the Y axis.  A bounding box X dimension apears scaled by the cosine of
        // the camera angle, and the Z by the sine.  The Y dimension is unscaled.
        const angle = Math.acos(orientation[3]) * 2;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        // For the normal scale, use the smaller body's bounding box, and pick the
        // scaled dimension that is bigger.
        const size0 = (data0.maxvoxel[0] - data0.minvoxel[0])
          * (data0.maxvoxel[1] - data0.minvoxel[1]) * (data0.maxvoxel[2] - data0.minvoxel[2]);
        const size1 = (data1.maxvoxel[0] - data1.minvoxel[0])
          * (data1.maxvoxel[1] - data1.minvoxel[1]) * (data1.maxvoxel[2] - data1.minvoxel[2]);
        const minA = (size0 <= size1) ? data0.minvoxel : data1.minvoxel;
        const maxA = (size0 <= size1) ? data0.maxvoxel : data1.maxvoxel;
        const dimsA = [maxA[0] - minA[0], maxA[1] - minA[1], maxA[2] - minA[2]];
        const visibleXA = Math.abs(c * dimsA[0]);
        const visibleZA = Math.abs(s * dimsA[2]);
        let scale = Math.max(visibleXA, dimsA[1], visibleZA);
        // Make it a bit tighter.
        scale /= 2;

        // For the bird's eye view scale, use the bounding box for both bodies.
        const minB = [
          Math.min(data0.minvoxel[0], data1.minvoxel[0]),
          Math.min(data0.minvoxel[1], data1.minvoxel[1]),
          Math.min(data0.minvoxel[2], data1.minvoxel[2]),
        ];
        const maxB = [
          Math.max(data0.maxvoxel[0], data1.maxvoxel[0]),
          Math.max(data0.maxvoxel[1], data1.maxvoxel[1]),
          Math.max(data0.maxvoxel[2], data1.maxvoxel[2]),
        ];
        const dimsB = [maxB[0] - minB[0], maxB[1] - minB[1], maxB[2] - minB[2]];
        const visibleXB = Math.abs(c * dimsB[0]);
        const visibleZB = Math.abs(s * dimsB[2]);
        const scaleBirdsEye = Math.max(visibleXB, dimsB[1], visibleZB);

        return ([scale, scaleBirdsEye]);
      })
      .catch(onError)
  );
};

const dvidLogKey = (taskJson, userEmail) => (
  `${taskJson[TASK_KEYS.BODY_PT1]}+${taskJson[TASK_KEYS.BODY_PT2]}_${userEmail}`.replace(/,/g, '_')
);

const isDvidSource = (source) => (
  source.toLowerCase().startsWith('dvid')
);

const bodyPointsLayer = (bodyPt0, bodyPt1, bodyId0, bodyId1) => (
  {
    type: 'annotation',
    name: 'body points',
    annotations: [
      { point: bodyPt0, type: 'point', id: bodyId0.toString() },
      { point: bodyPt1, type: 'point', id: bodyId1.toString() },
    ],
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

const doLiveMerge = (assnMngr) => {
  const segSrc = assnMngr.assignment[TASK_KEYS.SEGMENTATION_SOURCE];
  if (isDvidSource(segSrc)) {
    const key = 'do live merge';
    if (!(key in assnMngr.assignment)) {
      return false;
    }
    return (assnMngr.assignment[key]);
  }
  return false;
};

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

const storeResults = (userEmail, bodyIds, selection, result, taskJson, taskStartTime, actions,
  dvidMngr, assnMngr) => {
  const bodyIdMergedOnto = bodyIds[0];
  const bodyIdOther = bodyIds[1];
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
    [TASK_KEYS.BODY_PT1]: taskJsonCopy[TASK_KEYS.BODY_PT1],
    [TASK_KEYS.BODY_PT2]: taskJsonCopy[TASK_KEYS.BODY_PT2],
    'body ID 1': bodyIdMergedOnto,
    'body ID 2': bodyIdOther,
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

  // TODO: Add live merging for MERGE_EXTRA.
  if ((result === RESULTS.MERGE_EXTRA) && doLiveMerge(assnMngr)) {
    const message = 'Live merging for "merge extra" is not yet supported';
    actions.addAlert({ severity: 'warning', message });
  }

  if ((result === RESULTS.MERGE) && doLiveMerge(assnMngr)) {
    const onCompletion = (res) => {
      dvidLogValue['mutation ID'] = res.MutationID;
      dvidMngr.postKeyValue('segmentation_focused', dvidLogKey(taskJsonCopy, userEmail), dvidLogValue);
      // TODO: Add Kafka logging?
      console.log(`Successful merge of ${bodyIdOther} onto ${bodyIdMergedOnto}, mutation ID ${res.MutationID}`);
    };
    const onError = (err) => {
      // TODO: Add proper error reporting.
      console.error(`Failed to merge ${bodyIdOther} onto ${bodyIdMergedOnto}: `, err);
    };
    dvidMngr.postMerge(bodyIdMergedOnto, bodyIdOther, onCompletion, onError);
  } else {
    dvidMngr.postKeyValue('segmentation_focused', dvidLogKey(taskJsonCopy, userEmail), dvidLogValue);
  }
};

// Returns [result, completed]
const restoreResults = (taskJson) => {
  const completed = !!taskJson.completed;
  const result = [RESULTS.DONT_MERGE, completed];
  return (result);
};

//
// The React component for focused proofreading.  Per the latest suggestions,
// it is a functional component using hooks to manage state and side effects.
// State shared with other components in the application is managed using
// Redux, accessed with the functions in the `actions` prop.

function FocusedProofreading(props) {
  const { actions, children } = props;

  const user = useSelector((state) => state.user.get('googleUser'), shallowEqual);

  const [dvidMngr] = React.useState(() => (new DvidManager()));
  const [dvidMngrDialogOpen, setDvidMngrDialogOpen] = React.useState(false);

  const [assnMngr] = React.useState(() => (new AssignmentManager()));
  const [assnMngrLoading, setAssnMngrLoading] = React.useState(false);

  const [taskJson, setTaskJson] = React.useState(undefined);
  const [taskStartTime, setTaskStartTime] = React.useState(0);
  const [bodyIds, setBodyIds] = React.useState([]);
  const [extraBodyIds, setExtraBodyIds] = React.useState([]);
  const [promptToAddExtra, setPromptToAddExtra] = React.useState(true);
  const [initialPosition, setInitialPosition] = React.useState(undefined);
  const [initialOrientation, setInitialOrientation] = React.useState(undefined);
  const [initialScale, setInitialScale] = React.useState(undefined);
  const [normalScale, setNormalScale] = React.useState(100);
  const [birdsEyeScale, setBirdsEyeScale] = React.useState(100);
  const [usingBirdsEye, setUsingBirdsEye] = React.useState(false);
  const [usedBirdsEye, setUsedBirdsEye] = React.useState(false);
  const [result, setResult] = React.useState(RESULTS.DONT_MERGE);
  const [completed, setCompleted] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [bodyIdsAreSelected, setBodyIdsAreSelected] = React.useState(true);

  // Not state, because changes occur during event processing and should not trigger rendering.
  const selection = React.useRef([]);
  const onVisibleChangedTimeoutPending = React.useRef(false);

  const setupAssn = React.useCallback(() => {
    const json = assnMngr.assignment;
    const setViewer = () => {
      actions.setViewerGrayscaleSource(dvidMngr.grayscaleSourceURL());
      actions.setViewerSegmentationSource(dvidMngr.segmentationSourceURL());
      /* TODO: DISABLED_TODOS: this action causes an error in Neuroglancer, no "valid user"
      actions.setViewerTodosSource(dvidMngr.todosSourceURL());
      */
    };
    let resolver;
    if ((TASK_KEYS.GRAYSCALE_SOURCE in json) && (TASK_KEYS.SEGMENTATION_SOURCE in json)
        && ((TASK_KEYS.DVID_SOURCE in json) || isDvidSource(json[TASK_KEYS.SEGMENTATION_SOURCE]))) {
      const dvid = json[TASK_KEYS.DVID_SOURCE] || '';
      dvidMngr.init(json[TASK_KEYS.GRAYSCALE_SOURCE], json[TASK_KEYS.SEGMENTATION_SOURCE], dvid);
      setViewer();
      // This promise immediately calls the `.then(...)` code, as there is no dialog to wait for.
      return new Promise((resolve) => { resolve(); });
    }
    const onDvidInitialized = () => {
      setDvidMngrDialogOpen(false);
      setViewer();
      resolver();
    };
    dvidMngr.initForDialog(onDvidInitialized, 'Segmentation', json[TASK_KEYS.GRAYSCALE_SOURCE], json[TASK_KEYS.SEGMENTATION_SOURCE]);
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
    const bodyPts = bodyPoints(json);
    const userEmail = user.getBasicProfile().getEmail();
    if (!bodyPts) {
      return new Promise((resolve) => { resolve(AssignmentManager.TASK_SKIP); });
    }
    return (
      getBodyId(bodyPts[0], dvidMngr, json, 1, onError(1))
        .then((bodyId0) => (
          getBodyId(bodyPts[1], dvidMngr, json, 2, onError(2)).then((bodyId1) => [bodyId0, bodyId1])
        ))
        .then(([bodyId0, bodyId1]) => (
          dvidMngr.getKeyValue('segmentation_focused', dvidLogKey(json, userEmail), onError(3))
            .then((data) => [bodyId0, bodyId1, data])
        ))
        .then(([bodyId0, bodyId1, prevResult]) => {
          const segments = [bodyId0, bodyId1];
          if ((bodyId0 === DvidManager.NO_INTERNET) || (bodyId1 === DvidManager.NO_INTERNET)
            || (prevResult === DvidManager.NO_INTERNET)) {
            setTaskJson(taskJsonOld);
            return (AssignmentManager.TASK_RETRY);
          }
          if (!bodyId0 || !bodyId1) {
            storeResults(userEmail, segments, [], 'skip (missing body ID)', json, startTime, actions, dvidMngr, assnMngr);
            return (AssignmentManager.TASK_SKIP);
          }
          if (bodyId0 === bodyId1) {
            // Skip a task involving bodies that have been merged already.
            storeResults(userEmail, segments, [], 'skip (same body ID)', json, startTime, actions, dvidMngr, assnMngr);
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
          setExtraBodyIds(getExtraBodyIds(json, segments));
          setPromptToAddExtra(true);
          const [restoredResult, restoredCompleted] = restoreResults(json);
          const { position, projectionOrientation } = cameraPose(bodyPts);
          cameraProjectionScale(segments, projectionOrientation, json, dvidMngr)
            .then(([scale, scaleBirdsEye]) => {
              setTaskJson(json);
              setBodyIds(segments);
              setBodyIdsAreSelected(true);
              setNormalScale(scale);
              setBirdsEyeScale(scaleBirdsEye);
              setInitialPosition(position);
              setInitialOrientation(projectionOrientation);
              setInitialScale(scale);
              setResult(restoredResult);
              setCompleted(restoredCompleted);

              selection.current = segments;

              actions.setViewerSegments(segments);
              actions.setViewerSegmentColors(bodyColors(segments, selection.current,
                restoredResult));
              actions.addViewerLayer(bodyPointsLayer(bodyPts[0], bodyPts[1], bodyId0, bodyId1));
              actions.addViewerLayer(falseMergesLayer());
              actions.setViewerCrossSectionScale(0.4);
              actions.setViewerCameraPosition(position);
              actions.setViewerCameraProjectionOrientation(projectionOrientation);
              actions.setViewerCameraProjectionScale(scale);
            });
          return (AssignmentManager.TASK_OK);
        })
    );
  }, [actions, user, taskJson, selection, assnMngr, dvidMngr]);

  const noTask = (taskJson === undefined);
  const prevDisabled = noTask || assnMngr.prevButtonDisabled();
  const nextDisabled = noTask || assnMngr.nextButtonDisabled();

  React.useEffect(() => {
    assnMngr.init(setupAssn, setupTask, actions.addAlert);
  }, [assnMngr, setupAssn, setupTask, actions]);

  const handleLoadButton = () => {
    setAssnMngrLoading(true);
    const onLoadInteractionDone = () => setAssnMngrLoading(false);
    assnMngr.load(onLoadInteractionDone);
  };

  const resetForNewTask = () => {
    setUsingBirdsEye(false);
    setUsedBirdsEye(false);
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

  const handleResultChange = (newResult) => {
    actions.setViewerSegmentColors(bodyColors(bodyIds, selection.current, newResult));
  };

  const handleResultRadio = (event) => {
    setResult(event.target.value);
    handleResultChange(event.target.value);
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
  };

  const handleTaskCompleted = (isCompleted) => {
    const falseMerges = falseMergePositions();
    if ((result === RESULTS.MERGE_LATER) && (falseMerges.length === 0)) {
      const message = 'The "merge later" result is not valid without at least one "false merges" annotation.';
      actions.addAlert({ severity: 'error', message });
      return;
    }

    setCompleted(isCompleted);
    taskJson.completed = isCompleted;
    if (isCompleted) {
      const userEmail = user.getBasicProfile().getEmail();
      storeResults(userEmail, bodyIds, selection.current, result, taskJson, taskStartTime, actions,
        dvidMngr, assnMngr);
    }
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
        if (usedBirdsEye) {
          handleTaskCompleted(true);
          if (!nextDisabled) {
            handleNextButton();
          }
        }
      } else if (event.key === keyBindings.focusedProofreadingCycleResults.key) {
        const newResult = RESULT_CYCLES_NEXT[result];
        setResult(newResult);
        handleResultChange(newResult);
      } else if (event.key === keyBindings.focusedProofreadingToggleBirdsEyeView.key) {
        const startUsingBirdsEye = !usingBirdsEye;
        if (startUsingBirdsEye) {
          const ngState = getNeuroglancerViewerState();
          setNormalScale(ngState.projectionScale);
        }
        const scale = startUsingBirdsEye ? birdsEyeScale : normalScale;
        setUsedBirdsEye(usedBirdsEye || startUsingBirdsEye);
        actions.setViewerCameraProjectionScale(scale);
        setUsingBirdsEye(startUsingBirdsEye);
      } else if (event.key === keyBindings.focusedProofreadingInitialView.key) {
        handleInitialView();
      }
    }
  };

  // Neuroglancer's notion of "visible" corresponds to other applications' notion of "selected".
  const onVisibleChanged = (segments, layer) => {
    if (layer.name === 'segmentation') {
      const selectionStrings = segments.toJSON();
      selection.current = selectionStrings.map((s) => parseInt(s, 10));
      setBodyIdsAreSelected(bodyIds.every((id) => selection.current.includes(id)));
      if (result === RESULTS.MERGE_EXTRA) {
        // The newly visible segments may need to be colored as merged.  But Neuroglancer seems
        // to change the visible segments in several steps, and issuing the action to change
        // the segment colors can trigger a cascade of further visiblity changes that end up with
        // the wrong segments visible.  So postpone the color change until control returns to the
        // event loop, which will be after all of Neuroglaner's changes.
        if (!onVisibleChangedTimeoutPending.current) {
          onVisibleChangedTimeoutPending.current = true;
          setTimeout(() => {
            actions.setViewerSegmentColors(bodyColors(bodyIds, selection.current, result));
            onVisibleChangedTimeoutPending.current = false;
          }, 0);
        }
      }
    }
  };

  const eventBindingsToUpdate = Object.entries(keyBindings).map((e) => [`key${e[1].key}`, `control+key${e[1].key}`]);

  // Add `onVisibleChanged` to the props of the child, which is a react-neuroglancer viewer.
  const childrenWithMoreProps = React.Children.map(children, (child) => (
    React.cloneElement(child, { eventBindingsToUpdate, onVisibleChanged }, null)
  ));

  const noExtra = (extraBodyIds.length === 0);

  const enableCompleted = usedBirdsEye && bodyIdsAreSelected;
  let tooltip = '';
  if (!usedBirdsEye) {
    tooltip = `use bird's eye view (key "${keyBindings.focusedProofreadingToggleBirdsEyeView.key}")`;
  }
  if (!bodyIdsAreSelected) {
    tooltip += (!usedBirdsEye) ? '; and ' : '';
    tooltip += 'select the task\'s two original bodies';
  }
  tooltip = `To enable "Completed": ${tooltip}`;

  return (
    <div
      className="focused-proofreading-container"
      tabIndex={0}
      onKeyPress={handleKeyPress}
    >
      <div className="focused-proofreading-control-row">
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
        <FormControl component="fieldset" disabled={noTask}>
          <RadioGroup row name="proofReadingResults" value={result} onChange={handleResultRadio}>
            <FormControlLabel
              label={RESULT_LABELS.DONT_MERGE}
              control={<Radio />}
              value={RESULTS.DONT_MERGE}
            />
            <FormControlLabel
              label={RESULT_LABELS.MERGE}
              control={<Radio />}
              value={RESULTS.MERGE}
            />
            <FormControlLabel
              label={RESULT_LABELS.MERGE_EXTRA}
              control={<Radio />}
              value={RESULTS.MERGE_EXTRA}
            />
            <FormControlLabel
              label={RESULT_LABELS.MERGE_LATER}
              control={<Radio />}
              value={RESULTS.MERGE_LATER}
            />
            <FormControlLabel
              label={RESULT_LABELS.DONT_KNOW}
              control={<Radio />}
              value={RESULTS.DONT_KNOW}
            />
            <Button color="primary" variant="contained" onClick={handleExtraButton} disabled={noTask || noExtra}>
              {promptToAddExtra ? 'Suggest Extra' : 'Unsuggest Extra'}
            </Button>
            <Tooltip title={(noTask || enableCompleted) ? '' : tooltip}>
              <FormControlLabel
                label="Completed"
                control={<Checkbox disabled={!enableCompleted} checked={completed} onChange={handleCompletedCheckbox} name="completed" />}
              />
            </Tooltip>
          </RadioGroup>
        </FormControl>
        <IconButton onClick={handleHelpOpen}>
          <HelpIcon />
        </IconButton>
        <ThemeProvider theme={dialogTheme}>
          <DvidManagerDialog manager={dvidMngr} open={dvidMngrDialogOpen} />
          <AssignmentManagerDialog manager={assnMngr} open={assnMngrLoading} />
          <ProtocolHelp
            title="Focused Proofreading Help"
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

FocusedProofreading.propTypes = {
  actions: PropTypes.object.isRequired,
  children: PropTypes.object.isRequired,
};

export default withStyles(styles)(FocusedProofreading);
