import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

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
  isValidAnnotation,
  getAnnotationPos,
  getAnnotationIcon,
  toAnnotationPayload,
  getAnnotationUrl,
} from './AnnotationUtils';
import AnnotationToolControl from './AnnotationToolControl';
import ImportAnnotation from './ImportAnnotation';
import ExportAnnotation from './ExportAnnotation';
import debounce from '../utils/debounce';

function AnnotationTable(props) {
  const {
    layerName, dataConfig, actions, tools, setSelectionChangedCallback,
  } = props;
  const [data, setData] = React.useState({ rows: [] });
  const [selectedAnnotation, setSelectedAnnotation] = React.useState(null);

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
    if (source) {
      const newData = [];
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

      setSelectedAnnotation(getSelectedAnnotationId(undefined, layerName));
      /*
      const layer = getAnnotationLayer(undefined, layerName);
      if (layer.selectedAnnotation && layer.selectedAnnotation.value) {
        setSelectedAnnotation(layer.selectedAnnotation.value.id);
      }
      */
    }
  }, 250, false), [layerName, annotationToItem]);

  const onAnnotationAdded = React.useCallback((annotation) => {
    // console.log(annotation);
    // if (!annotation.source || annotation.source === 'downloaded:last') {
    updateTableRows(annotation.source ? undefined : annotation.id);
    if (!annotation.source) {
      const isValid = isValidAnnotation(annotation, dataConfig);
      actions.addAlert({
        severity: isValid ? 'success' : 'info',
        message: `${isValid ? 'New' : ' Temporary'} annotation added @(${getAnnotationPos(annotation).join(', ')}) in [${layerName}]`,
        duration: 1000,
      });
    }
    // }
  }, [updateTableRows, dataConfig, layerName, actions]);

  const onAnnotationDeleted = React.useCallback((id) => {
    actions.addAlert({
      severity: 'success',
      message: `Annotation ${id} deleted in [${layerName}]`,
      duration: 2000,
    });
    updateTableRows();
  }, [updateTableRows, actions, layerName]);

  const onAnnotationUpdated = React.useCallback(() => {
    // console.log(annotation);
    updateTableRows();
  }, [updateTableRows]);

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

  if (setSelectionChangedCallback) {
    setSelectionChangedCallback(() => {
      onAnnotationSelectionChanged(getSelectedAnnotationId(undefined, layerName));
    });
  }

  useEffect(() => {
    if (data.rows.length === 0) {
      updateTableRows();
    }
  }, [
    data,
    updateTableRows,
  ]);

  useEffect(() => {
    const configureAnnotationLayerFunc = (layer) => configureAnnotationLayerChanged(layer, {
      onAnnotationAdded,
      onAnnotationDeleted,
      onAnnotationUpdated,
      onAnnotationSelectionChanged,
    }, (remover) => addLayerSignalRemover(undefined, layerName, remover));

    return configureLayersChangedSignals(undefined, {
      layerName,
      process: configureAnnotationLayerFunc,
    });
  }, [
    layerName,
    onAnnotationAdded,
    onAnnotationDeleted,
    onAnnotationUpdated,
    onAnnotationSelectionChanged,
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

  return (
    <div>
      <DataTable
        data={data}
        selectedId={selectedAnnotation}
        config={dataConfig}
        getId={React.useCallback((row) => row.id, [])}
        getLocateIcon={getLocateIcon}
        makeHeaderRow={makeTableHeaderRow}
      />
      <hr />
      {tools ? <AnnotationToolControl tools={tools} actions={actions} defaultTool="annotatePoint" onToolChanged={handleToolChange} /> : null}
    </div>
  );
}

AnnotationTable.propTypes = {
  layerName: PropTypes.string.isRequired,
  dataConfig: PropTypes.object.isRequired,
  tools: PropTypes.arrayOf(PropTypes.object),
  actions: PropTypes.object.isRequired,
  setSelectionChangedCallback: PropTypes.func,
};

AnnotationTable.defaultProps = {
  tools: null,
  setSelectionChangedCallback: null,
};

export default AnnotationTable;
