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
} from '@janelia-flyem/react-neuroglancer';

// import Divider from '@material-ui/core/Divider';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Box from '@material-ui/core/Box';
import {
  getSortedFieldArray,
  sortColumns,
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
} from './AnnotationUtils';
import AnnotationToolControl from './AnnotationToolControl';
import AnnotationUserGroup from './AnnotationUserGroup';
import ImportAnnotation from './ImportAnnotation';
import ExportAnnotation from './ExportAnnotation';
import debounce from '../utils/debounce';
import { getLayerFromState } from '../utils/state';
// import { useLocalStorage } from '../utils/hooks';
// import BodyAnnotationTable from './BodyAnnotationTable';

const DEBUG = false;

/*
function getLayerFromState(state, layerName) {
  const layers = state.viewer.getIn(['ngState', 'layers']);
  const layer = layers.find((e) => (e.name === layerName));

  return layer;
}
*/

function AnnotationTable(props) {
  const {
    layerName,
    dataConfig,
    actions,
    tools,
    user,
    setSelectionChangedCallback,
    dataSource,
  } = props;
  const [data, setData] = React.useState({});
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [columns, setColumns] = useState(dataConfig.columns);

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

  useEffect(() => {
    const groups = getSelectedGroups();
    setSelectedGroups(groups);
  }, [getSelectedGroups, setSelectedGroups]);

  const annotationToItem = React.useCallback(
    (annotation) => getRowItemFromAnnotation(annotation, {
      layerName,
      user,
      locate: (targetLayerName, id, pos) => {
        actions.setViewerAnnotationSelection({
          layerName: targetLayerName,
          annotationId: id,
          host: getAnnotationSelectionHost(),
        });
        actions.setViewerCameraPosition(pos);
      },
    }), [layerName, user, actions],
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

  const tableControls = (
    <div style={{ display: 'flex', flexFlow: 'row' }}>
      {groupSelection}
      <div style={{ height: '100%', width: '10px' }} />
      {fieldSelection}
    </div>
  );

  return (
    <div>
      <DataTable
        data={{ rows: data.rows || [] }}
        selectedId={selectedAnnotation}
        config={{ ...dataConfig, columns }}
        getId={React.useCallback((row) => row.id, [])}
        getLocateIcon={getLocateIcon}
        makeHeaderRow={makeTableHeaderRow}
        tableControls={tableControls}
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
      {/* {dataConfig.bodyAnnotation ? (
        <BodyAnnotationTable config={dataConfig.bodyAnnotation} />
      ) : null} */}
    </div>
  );
}

AnnotationTable.propTypes = {
  layerName: PropTypes.string.isRequired,
  dataConfig: PropTypes.object.isRequired,
  dataSource: PropTypes.object.isRequired,
  user: PropTypes.string.isRequired,
  actions: PropTypes.object.isRequired,
  tools: PropTypes.arrayOf(PropTypes.object),
  setSelectionChangedCallback: PropTypes.func,
};

AnnotationTable.defaultProps = {
  tools: null,
  setSelectionChangedCallback: null,
};

export default AnnotationTable;
