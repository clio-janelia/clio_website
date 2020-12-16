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

function AnnotationTable(props) {
  const {
    layerName, dataConfig, locateItem,
  } = props;
  const [data, setData] = React.useState({ rows: [] });
  const [selectedAnnotation, setSelectedAnnotation] = React.useState(null);

  const annotationToItem = React.useCallback((annotation) => {
    const newAnnotation = { ...annotation };
    let newItem;
    if (annotation.type === 0) { // point annotation
      const { id } = annotation;
      const pos = [
        annotation.point[0], annotation.point[1], annotation.point[2],
      ];
      let comment = '';
      let type = '';
      let title = '';
      if (annotation.prop) {
        if (annotation.prop.type) {
          type = annotation.prop.type;
        }
        if (annotation.prop.comment) {
          comment = annotation.prop.comment;
        }
        if (annotation.prop.title) {
          title = annotation.prop.title;
        }
      }

      newItem = {
        id: `${id}`,
        pos: `(${pos[0]}, ${pos[1]}, ${pos[2]})`,
        title,
        comment,
        type,
        locate: () => { locateItem(pos); },
        deleteAction: () => {
          const source = getAnnotationSource(undefined, layerName);
          console.log(source);
          source.delete(source.getReference(id));
        },
        updateAction: (change) => {
          const source = getAnnotationSource(undefined, layerName);
          let changed = false;
          if (change.title !== undefined) {
            newAnnotation.prop.title = change.title;
            changed = true;
          }
          if (change.comment !== undefined) {
            newAnnotation.prop.comment = change.comment;
            changed = true;
          }
          if (change.type !== undefined) {
            newAnnotation.prop.type = change.type;
            changed = true;
          }
          if (changed) {
            source.update(source.getReference(id), newAnnotation);
            source.commit(source.getReference(id));
          }
        },
      };
    }
    return newItem;
  }, [layerName, locateItem]);

  const updateTableRows = React.useCallback((annotation) => {
    const source = getAnnotationSource(undefined, layerName);
    if (source) {
      const newData = [];
      source.references.forEach((ref) => {
        if (ref.value) {
          const item = annotationToItem(ref.value);
          if (annotation && !annotation.source && item.id === annotation.id) {
            console.log('new annotation added:', annotation.id);
          }
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
      updateTableRows(annotation);
    }
  }, [updateTableRows]);

  const onAnnotationDeleted = React.useCallback((id) => {
    console.log(id);
    updateTableRows();
  }, [updateTableRows]);

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
      getKey={(row) => row.id}
    />
  );
}

AnnotationTable.propTypes = {
  layerName: PropTypes.string.isRequired,
  dataConfig: PropTypes.object.isRequired,
  locateItem: PropTypes.func.isRequired,
};

export default AnnotationTable;
