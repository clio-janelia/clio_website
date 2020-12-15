import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import {
  getAnnotationSource,
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

  const updateTable = React.useCallback(() => {
    const source = getAnnotationSource(undefined, layerName);
    if (source) {
      const newData = [];
      source.references.forEach((ref) => {
        if (ref.value) {
          newData.push(annotationToItem(ref.value));
        }
      });
      setData({ rows: newData });
    }
  }, [layerName, annotationToItem]);

  const onAnnotationAdded = React.useCallback((annotation) => {
    console.log(annotation);
    if (!annotation.source || annotation.source === 'downloaded:last') {
      updateTable();
    }
  }, [updateTable]);

  const onAnnotationDeleted = React.useCallback((id) => {
    console.log(id);
    updateTable();
  }, [updateTable]);

  const onAnnotationUpdated = React.useCallback((annotation) => {
    console.log(annotation);
    updateTable();
  }, [updateTable]);

  useEffect(() => {
    if (data.rows.length === 0) {
      updateTable();
    }
  }, [
    data,
    updateTable,
  ]);

  useEffect(() => {
    const configureAnnotationLayerFunc = (layer) => configureAnnotationLayerChanged(layer, {
      onAnnotationAdded,
      onAnnotationDeleted,
      onAnnotationUpdated,
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
  ]);

  return (
    <DataTable data={data} config={dataConfig} getKey={(row) => row.id} />
  );
}

AnnotationTable.propTypes = {
  layerName: PropTypes.string.isRequired,
  dataConfig: PropTypes.object.isRequired,
  locateItem: PropTypes.func.isRequired,
};

export default AnnotationTable;
