import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useSelector, shallowEqual } from 'react-redux';

import {
  closeSelectionTab,
  getAnnotationSource,
  getAnnotationSelectionHost,
  configureAnnotationLayerChanged,
  configureLayersChangedSignals,
  addLayerSignalRemover,
  getSelectedAnnotationId,
  parseUrlHash,
} from '@janelia-flyem/react-neuroglancer';

// import Divider from '@material-ui/core/Divider';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import DeleteChecked from '@material-ui/icons/DeleteSweepOutlined';
import TransferIcon from '@material-ui/icons/AssignmentReturnedOutlined';
import Tooltip from '@material-ui/core/Tooltip';
import { setSyncStateNeeded } from '../reducers/viewer';
import {
  getSortedFieldArray,
  sortColumns,
  useStyles,
  getColumnFields,
} from './DataTable/DataTableUtils';
import DataFieldControl from './DataTable/DataFieldControl';
import DataTable from './DataTable/DataTable';
import {
  getRowItemFromAnnotation,
  getAnnotationIcon,
  toAnnotationPayload,
  getAnnotationUrl,
  getAnnotationUrlWithGroups,
  getGroupsFromAnnotationUrl,
  getUrlFromLayer,
  getAnnotationToolFromLayer,
  encodeAnnotation,
  getNewAnnotation,
  getAnnotationPos,
} from './AnnotationUtils';
import {
  pointToBodyAnnotation,
} from './AnnotationRequest';
import AnnotationToolControl from './AnnotationToolControl';
import AnnotationUserGroup from './AnnotationUserGroup';
import ImportAnnotation from './ImportAnnotation';
import ExportAnnotation from './ExportAnnotation';
import debounce from '../utils/debounce';
import { getLayerFromState } from '../utils/state';

const DEBUG = false;

function AnnotationTable(props) {
  const classes = useStyles();
  const {
    layerName,
    dataConfig,
    actions,
    tools,
    user,
    projectUrl,
    dataset,
    setSelectionChangedCallback,
    dataSource,
  } = props;
  const [data, setData] = React.useState({});
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [columns, setColumns] = useState(dataConfig.columns);
  // const isInitialMount = useRef(true);

  const sourceUrl = useSelector((state) => {
    const layer = getLayerFromState(state, layerName);
    return getUrlFromLayer(layer);
  }, shallowEqual);

  const annotationTool = useSelector((state) => {
    const layer = getLayerFromState(state, layerName);
    return getAnnotationToolFromLayer(layer);
  }, shallowEqual);

  const setSelectedGroups = React.useCallback((groups) => {
    // Need to clear selection to avoid incorrect deref
    closeSelectionTab();
    actions.setViewerLayerSource({
      layerName,
      source: (s) => ({ url: getAnnotationUrlWithGroups(s.url || s, groups) }),
    });
  }, [actions, layerName]);

  const getSelectedGroups = React.useCallback(
    () => getGroupsFromAnnotationUrl(sourceUrl),
    [sourceUrl],
  );

  const locate = React.useCallback((targetLayerName, id, pos, syncNeeded) => {
    if (syncNeeded) {
      setSyncStateNeeded(true);
    }
    actions.setViewerAnnotationSelection({
      layerName: targetLayerName,
      annotationId: id,
      host: getAnnotationSelectionHost(),
    });
    actions.setViewerCameraPosition(pos);
  }, [actions]);

  const annotationToItem = React.useCallback(
    (annotation) => getRowItemFromAnnotation(annotation, {
      layerName,
      user,
      locate,
      deleteAction: (id) => {
        const source = getAnnotationSource(undefined, layerName);
        // console.log(source);
        const reference = source.getReference(id);
        try {
          source.delete(reference);
        } catch (e) {
          // FIXME: needs better error handling.
          console.log(e);
        } finally {
          reference.dispose();
        }
      },
      updateAction: (annot, change) => {
        if (Object.keys(change).length > 0) {
          const source = getAnnotationSource(undefined, layerName);
          if (source) {
            const pos = getAnnotationPos(annotation);
            source.update(source.getReference(annot.id), getNewAnnotation(annot, change));
            source.commit(source.getReference(annot.id));
            locate(layerName, annot.id, pos, false);
          }
        }
      },
    }), [layerName, user, locate],
  );

  const uploadAnnotations = React.useCallback((payload) => {
    const source = getAnnotationSource(undefined, layerName);
    if (source) {
      const { parameters } = source;
      const url = getAnnotationUrl(parameters);
      const headers = {
        'Content-Type': 'application/json',
      };
      if (parameters.authServer === 'neurohub') {
        headers.Authorization = `Bearer ${dataConfig.getToken()}`;
      }
      return fetch(url, {
        method: 'POST',
        body: toAnnotationPayload(payload, parseUrlHash),
        headers,
      }).then((response) => {
        source.invalidateCache();
        if (!response.ok) {
          throw new Error(`Failed to upload annotations: ${response.statusText}`);
        }
      });
    }

    return Promise.reject(new Error('Failed to get annotation source.'));
  }, [layerName, dataConfig]);

  const getAnnotations = React.useCallback((filteredRows) => {
    const source = getAnnotationSource(undefined, layerName);
    if (source) {
      const { parameters } = source;
      const url = getAnnotationUrl(parameters);
      if (filteredRows) {
        return Promise.resolve(filteredRows.map((row) => encodeAnnotation(row.source_annotation)));
      }

      return fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${dataConfig.getToken()}`,
        },
      });
    }

    return Promise.reject(new Error('Failed to get annotation source.'));
  }, [layerName, dataConfig]);

  const updateTableRows = React.useCallback(debounce((newId) => {
    const source = getAnnotationSource(undefined, layerName);
    if (DEBUG) {
      console.log('updateTableRows:', source);
    }
    if (source) {
      const newData = [];
      if (DEBUG) {
        console.log('updateTableRows:', source.references);
      }
      source.references.forEach((ref) => {
        if (ref.value) {
          const item = annotationToItem(ref.value);
          if (item.id === newId) { // A newly added annotation
            item.defaultEditing = true;
          }
          newData.push(item);
        }
      });
      setData({ rows: newData.sort((r1, r2) => r2.timestamp - r1.timestamp) });

      if (newData.length > 0) {
        setSelectedAnnotation(getSelectedAnnotationId(undefined, layerName));
      }
    }
  }, 250, false), [layerName, annotationToItem]);

  const onAnnotationSelectionChanged = React.useCallback((annotation) => {
    // console.log('selected:', annotation);
    if (annotation) {
      if (typeof annotation === 'string') {
        setSelectedAnnotation(annotation);
      } else {
        setSelectedAnnotation(annotation.id);
      }
    } else {
      setSelectedAnnotation(null);
    }
  }, [setSelectedAnnotation]);

  const onAnnotationChanged = React.useCallback((source) => {
    if (['update', 'updated', 'deleted'].includes(source.action)) {
      updateTableRows();
    } else if (source.action === 'added') {
      updateTableRows(source.id);
    }
  }, [updateTableRows]);

  if (setSelectionChangedCallback) {
    setSelectionChangedCallback(() => {
      onAnnotationSelectionChanged(getSelectedAnnotationId(undefined, layerName));
    });
  }

  useEffect(() => {
    if (data.rows === undefined) { // For remount initialization
      updateTableRows();
    }
    // return updateTableRows.cancel; // This can cause premature cancel
  }, [
    data,
    updateTableRows,
  ]);

  useEffect(() => {
    setData({});
  }, [dataSource.name]);

  useEffect(() => {
    const configureAnnotationLayerFunc = (layer) => {
      // Update rows here to make sure the table is updated after switching to a cached source.
      // FIXME: ideally it should be triggered by source switch directly.
      updateTableRows();
      return configureAnnotationLayerChanged(layer, {
        onAnnotationSelectionChanged,
        onAnnotationChanged,
      }, (remover) => addLayerSignalRemover(undefined, layerName, remover));
    };

    return configureLayersChangedSignals(undefined, {
      layerName,
      process: configureAnnotationLayerFunc,
      cancel: updateTableRows.cancel,
    });
  }, [
    layerName,
    onAnnotationSelectionChanged,
    onAnnotationChanged,
    updateTableRows,
  ]);

  const handleToolChange = React.useCallback((tool) => {
    actions.setViewerAnnotationTool({
      layerName,
      annotationTool: tool,
    });
  }, [layerName, actions]);

  const getLocateIcon = React.useCallback((row, selected) => (getAnnotationIcon(row.kind, 'locate', selected, row.checked)), []);

  const makeTableHeaderRow = React.useCallback((dataHeaders, filteredRows) => (
    <TableRow>
      <TableCell padding="none" className={classes.headToolColumn}>
        <Box display="flex" flexDirection="row">
          {dataConfig.allowingImport ? (
            <ImportAnnotation
              kind={dataConfig.kind}
              upload={uploadAnnotations}
              addAlert={actions.addAlert}
            />
          ) : null}
          {dataConfig.allowingExport ? (
            <>
              <ExportAnnotation
                kind={dataConfig.kind}
                getData={() => getAnnotations(filteredRows)}
                fields={getColumnFields(dataConfig.columns)}
              />
            </>
          ) : null}
        </Box>
      </TableCell>
      {dataHeaders}
      <TableCell />
    </TableRow>
  ), [dataConfig, uploadAnnotations, getAnnotations, actions.addAlert, classes]);

  const { groups } = dataSource;
  const groupSelection = groups && groups.length > 0
    ? (
      <AnnotationUserGroup
        groups={groups}
        getSelectedGroups={getSelectedGroups}
        onChange={setSelectedGroups}
      />
    ) : null;

  let fieldSelection = null;
  if (dataConfig.columns.shape) {
    fieldSelection = (
      <DataFieldControl
        fields={getSortedFieldArray(columns)}
        selectedFields={columns.shape}
        onChange={(value) => {
          setColumns(sortColumns({
            ...columns,
            shape: value,
          }));
        }}
      />
    );
  }

  const makeTableControl = React.useCallback(() => (
    <div style={{ display: 'flex', flexFlow: 'row' }}>
      {groupSelection}
      <div style={{ height: '100%', width: '10px' }} />
      {fieldSelection}
    </div>
  ), [groupSelection, fieldSelection]);

  const makeCheckedSetControl = React.useCallback((checkedSet) => {
    const { rows } = data;
    return (
      <span>
        <Tooltip title="Delete checked annotations">
          <IconButton
            onClick={() => {
              const deleteActions = [];
              rows.forEach((row) => {
                if (row.deleteAction) {
                  if (checkedSet.has(row.id)) {
                    deleteActions.push(() => {
                      row.deleteAction();
                    });
                  }
                }
              });
              deleteActions.forEach((action) => action());
            }}
            style={{ color: 'red' }}
          >
            <DeleteChecked />
          </IconButton>
        </Tooltip>
        { (checkedSet.size < 10 && dataConfig.kind === 'Normal') ? (
          <Tooltip title="Transform checked annotations to body">
            <IconButton
              color="primary"
              onClick={() => {
                const succList = [];
                const failedList = [];
                let currentPromise = null;
                checkedSet.forEach((checkedId) => {
                  const row = rows.find((r) => r.id === checkedId);
                  if (row) {
                    const { point } = row.source_annotation;
                    const transform = () => pointToBodyAnnotation({
                      projectUrl,
                      token: dataConfig.getToken(),
                      user,
                      dataset,
                    }, row.source_annotation).then((bodyAnnotation) => {
                      succList.push(`${point.join(',')}➟${bodyAnnotation.bodyid}`);
                    }).catch((error) => {
                      failedList.push(`${point.join(',')}:${error.message}`);
                    });
                    if (currentPromise) {
                      currentPromise = currentPromise.finally(transform);
                    } else {
                      currentPromise = transform();
                    }
                  }
                });
                if (currentPromise) {
                  currentPromise.finally(() => {
                    const message = `[Point to Body] SUMMARY: ${succList.length} succeeded; ${failedList.length} failed. ⎈DETAIL: ${succList.join('; ')}${succList.length === 1 ? '; ' : ''}${failedList.join('; ')}`;
                    if (succList.length + failedList.length > 0) {
                      actions.addAlert({
                        severity: failedList.length > 0 ? 'warning' : 'success',
                        message,
                      });
                    }
                  });
                }
              }}
            >
              <TransferIcon style={{ transform: 'rotate(-90deg)' }} />
            </IconButton>
          </Tooltip>
        ) : null}
      </span>
    );
  }, [data, dataConfig, dataset, projectUrl, user, actions]);

  return (
    <div style={{ width: '100%' }}>
      <DataTable
        data={{ rows: data.rows || [] }}
        selectedId={selectedAnnotation}
        config={{ ...dataConfig, columns }}
        getId={React.useCallback((row) => row.id, [])}
        getLocateIcon={getLocateIcon}
        makeHeaderRow={makeTableHeaderRow}
        makeTableControl={makeTableControl}
        makeCheckedSetControl={makeCheckedSetControl}
      />
      <hr />
      {tools ? (
        <AnnotationToolControl
          tools={tools}
          actions={actions}
          selectedTool={annotationTool}
          onToolChanged={handleToolChange}
        />
      ) : null}
    </div>
  );
}

AnnotationTable.propTypes = {
  layerName: PropTypes.string.isRequired,
  dataConfig: PropTypes.object.isRequired,
  dataSource: PropTypes.object.isRequired,
  user: PropTypes.string.isRequired,
  projectUrl: PropTypes.string.isRequired,
  dataset: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  tools: PropTypes.arrayOf(PropTypes.object),
  setSelectionChangedCallback: PropTypes.func,
};

AnnotationTable.defaultProps = {
  tools: null,
  setSelectionChangedCallback: null,
};

export default AnnotationTable;
