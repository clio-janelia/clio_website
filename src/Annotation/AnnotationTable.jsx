import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import {
  getAnnotationSource,
  getAnnotationLayer,
  configureAnnotationLayerChanged,
  configureLayersChangedSignals,
  addLayerSignalRemover,
} from '@janelia-flyem/react-neuroglancer';

import DataTable from './DataTable/DataTable';
import { getRowItemFromAnnotation, isValidAnnotation } from './AnnotationUtils';

function AnnotationTable(props) {
  const {
    layerName, dataConfig, locateItem, actions,
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
        });
        locateItem(pos);
      },
    }), [layerName, locateItem, actions],
  );

  const updateTableRows = React.useCallback(() => {
    const source = getAnnotationSource(undefined, layerName);
    if (source) {
      const newData = [];
      source.references.forEach((ref) => {
        if (ref.value) {
          const item = annotationToItem(ref.value);
          newData.push(item);
        }
      });
      setData({ rows: newData });

      const layer = getAnnotationLayer(undefined, layerName);
      if (layer.selectedAnnotation && layer.selectedAnnotation.value) {
        setSelectedAnnotation(layer.selectedAnnotation.value.id);
      }
    }
  }, [layerName, annotationToItem]);

  const onAnnotationAdded = React.useCallback((annotation) => {
    // console.log(annotation);
    if (!annotation.source || annotation.source === 'downloaded:last') {
      updateTableRows();
      if (!annotation.source) {
        const isValid = isValidAnnotation(annotation, dataConfig);
        actions.addAlert({
          severity: isValid ? 'success' : 'info',
          message: `${isValid ? 'New' : ' Temporary'} annotation added @(${annotation.point[0]}, ${annotation.point[1]}, ${annotation.point[2]}) in [${layerName}]`,
          duration: 1000,
        });
      }
    }
  }, [updateTableRows, dataConfig, layerName, actions]);

  const onAnnotationDeleted = React.useCallback((id) => {
    actions.addAlert({
      severity: 'success',
      message: `Annotation ${id} deleted in [${layerName}]`,
      duration: 2000,
    });
    updateTableRows();
  }, [updateTableRows, actions, layerName]);

  const onAnnotationUpdated = React.useCallback((annotation) => {
    console.log(annotation);
    updateTableRows();
  }, [updateTableRows]);

  const onAnnotationSelectionChanged = React.useCallback((annotation) => {
    console.log('selected:', annotation);
    if (annotation) {
      setSelectedAnnotation(annotation.id);
    } else {
      setSelectedAnnotation(null);
    }
  }, [setSelectedAnnotation]);

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

  return (
    <DataTable
      data={data}
      selectedId={selectedAnnotation}
      config={dataConfig}
      getId={(row) => row.id}
    />
  );
}

AnnotationTable.propTypes = {
  layerName: PropTypes.string.isRequired,
  dataConfig: PropTypes.object.isRequired,
  locateItem: PropTypes.func.isRequired,
  actions: PropTypes.object.isRequired,
};

export default AnnotationTable;
