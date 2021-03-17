import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useSelector, shallowEqual } from 'react-redux';

import {
  getAnnotationSource,
  getAnnotationSelectionHost,
  configureAnnotationLayerChanged,
  configureLayersChangedSignals,
  addLayerSignalRemover,
  getSelectedAnnotationId,
} from '@janelia-flyem/react-neuroglancer';

import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Box from '@material-ui/core/Box';
import DataTable from './DataTable/DataTable';
import {
  getRowItemFromAnnotation,
  // isValidAnnotation,
  // getAnnotationPos,
  getAnnotationIcon,
  toAnnotationPayload,
  getAnnotationUrl,
  getAnnotationUrlWithGroups,
  getGroupsFromAnnotationUrl,
  getUrlFromLayer,
} from './AnnotationUtils';
import AnnotationToolControl from './AnnotationToolControl';
import AnnotationUserGroup from './AnnotationUserGroup';
import ImportAnnotation from './ImportAnnotation';
import ExportAnnotation from './ExportAnnotation';
import debounce from '../utils/debounce';

const DEBUG = false;

function AnnotationTable(props) {
  const {
    layerName, dataConfig, actions, tools, setSelectionChangedCallback, dataSource,
  } = props;
  const [data, setData] = React.useState({});
  const [selectedAnnotation, setSelectedAnnotation] = React.useState(null);

  const sourceUrl = useSelector((state) => {
    const layers = state.viewer.getIn(['ngState', 'layers']);
    const layer = layers.find((e) => (e.name === layerName));
    return getUrlFromLayer(layer);
  }, shallowEqual);

  const setSelectedGroups = React.useCallback((groups) => {
    actions.setViewerLayerSource({
      layerName,
      source: (s) => ({ url: getAnnotationUrlWithGroups(s.url || s, groups) }),
    });
  }, [actions, layerName]);

  const getSelectedGroups = React.useCallback(
    () => getGroupsFromAnnotationUrl(sourceUrl),
    [sourceUrl],
  );

  useEffect(() => {
    const groups = getSelectedGroups();
    setSelectedGroups(groups);
  }, [getSelectedGroups, setSelectedGroups]);

  const annotationToItem = React.useCallback(
    (annotation) => getRowItemFromAnnotation(annotation, {
      layerName,
      locate: (targetLayerName, id, pos) => {
        actions.setViewerAnnotationSelection({
          layerName: targetLayerName,
          annotationId: id,
          host: getAnnotationSelectionHost(),
        });
        actions.setViewerCameraPosition(pos);
      },
    }), [layerName, actions],
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
        headers.Authorization = `Bearer ${dataConfig.token}`;
      }
      return fetch(url, {
        method: 'POST',
        body: toAnnotationPayload(payload),
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

  const getAnnotations = React.useCallback(() => {
    const source = getAnnotationSource(undefined, layerName);
    if (source) {
      const { parameters } = source;
      const url = getAnnotationUrl(parameters);
      return fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${dataConfig.token}`,
        },
      }).then((response) => response.json());
      // return Promise.resolve(source.parameters);
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

  /*
  const onAnnotationAdded = React.useCallback((annotation) => {
    // console.log(annotation);
    // if (!annotation.source || annotation.source === 'downloaded:last') {
    updateTableRows(annotation.source ? undefined : annotation.id);
    if (!annotation.source) {
      const isValid = isValidAnnotation(annotation, dataConfig);
      actions.addAlert({
        severity: isValid ? 'success' : 'info',
        message: `${isValid ? 'New' : ' Temporary'} annotation added `
          `@(${getAnnotationPos(annotation).join(', ')}) in [${layerName}]`,
        duration: 1000,
      });
    }
    // }
  }, [dataConfig, layerName, actions]);
  */

  /*
  const onAnnotationDeleted = React.useCallback((id) => {
    actions.addAlert({
      severity: 'success',
      message: `Annotation ${id} deleted in [${layerName}]`,
      duration: 2000,
    });
    updateTableRows();
  }, [updateTableRows, actions, layerName]);
  */

  /*
  const onAnnotationUpdated = React.useCallback(() => {
    // console.log(annotation);
    updateTableRows();
  }, [updateTableRows]);
  */

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

  const getLocateIcon = React.useCallback((row, selected) => (getAnnotationIcon(row.kind, 'locate', selected)), []);

  const makeTableHeaderRow = React.useCallback((dataHeaders) => (
    <TableRow>
      <TableCell padding="none">
        <Box display="flex" flexDirection="row">
          {dataConfig.allowingImport ? (
            <ImportAnnotation
              kind={dataConfig.kind}
              upload={uploadAnnotations}
              addAlert={actions.addAlert}
            />
          ) : null}
          {dataConfig.allowingExport ? (
            <ExportAnnotation
              kind={dataConfig.kind}
              getData={getAnnotations}
            />
          ) : null}
        </Box>
      </TableCell>
      {dataHeaders}
      <TableCell />
    </TableRow>
  ), [dataConfig, uploadAnnotations, getAnnotations, actions.addAlert]);

  const { groups } = dataSource;
  const groupSelection = groups && groups.length > 0
    ? (
      <AnnotationUserGroup
        groups={groups}
        selectedGroups={getSelectedGroups()}
        onChange={(value) => { setSelectedGroups(value); }}
      />
    ) : null;

  return (
    <div>
      <DataTable
        data={{ rows: data.rows || [] }}
        selectedId={selectedAnnotation}
        config={dataConfig}
        getId={React.useCallback((row) => row.id, [])}
        getLocateIcon={getLocateIcon}
        makeHeaderRow={makeTableHeaderRow}
        tableControls={groupSelection}
      />
      <hr />
      {tools ? <AnnotationToolControl tools={tools} actions={actions} defaultTool="annotatePoint" onToolChanged={handleToolChange} /> : null}
    </div>
  );
}

AnnotationTable.propTypes = {
  layerName: PropTypes.string.isRequired,
  dataConfig: PropTypes.object.isRequired,
  dataSource: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  tools: PropTypes.arrayOf(PropTypes.object),
  setSelectionChangedCallback: PropTypes.func,
};

AnnotationTable.defaultProps = {
  tools: null,
  setSelectionChangedCallback: null,
};

export default AnnotationTable;
