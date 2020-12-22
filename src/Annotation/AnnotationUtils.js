import {
  getAnnotationSource,
  // getAnnotationLayer,
  // configureAnnotationLayerChanged,
  // configureLayersChangedSignals,
  // addLayerSignalRemover,
} from '@janelia-flyem/react-neuroglancer';

export const ANNOTATION_COLUMNS = [
  {
    title: 'Description',
    field: 'comment',
    filterEnabled: true,
    editElement: {
      type: 'input',
    },
  },
  {
    title: 'Position',
    field: 'pos',
  },
];

export const ATLAS_COLUMNS = [
  {
    title: 'Title',
    field: 'title',
    filterEnabled: true,
    placeholder: '*Required',
    editElement: {
      type: 'input',
    },
    checkValidity: (value, handleError) => {
      const isValid = value && value.trim();
      if (handleError && !isValid) {
        handleError('The title field of atlas cannot be empty. It will NOT be saved until a valid title is specified.');
      }
      return isValid;
    },
  },
  {
    title: 'Description',
    field: 'comment',
    filterEnabled: true,
    editElement: {
      type: 'input',
    },
  },
  {
    title: 'Position',
    field: 'pos',
  },
];

export function getNewAnnotation(annotation, prop) {
  const newAnnotation = { ...annotation };
  newAnnotation.prop = { ...newAnnotation.prop, ...prop };
  return newAnnotation;
}

function getPointAnnotationPos(annotation) {
  return [annotation.point[0], annotation.point[1], annotation.point[2]];
}

function getRowItemWithoutAction(annotation) {
  if (annotation.type === 0) { // point annotation
    const { id } = annotation;
    const pos = getPointAnnotationPos(annotation);
    const { comment, type, title } = annotation.prop ? annotation.prop : { comment: '', type: '', title: '' };

    return {
      id,
      pos: `(${pos[0]}, ${pos[1]}, ${pos[2]})`,
      title: title || '',
      comment: comment || '',
      type: type || '',
    };
  }

  return undefined;
}
export function getRowItemFromAnnotation(annotation, config) {
  let item = getRowItemWithoutAction(annotation);
  if (item) { // point annotation
    const { layerName, locate } = config;
    const newAnnotation = { ...annotation };
    const { id } = annotation;
    const pos = getPointAnnotationPos(annotation);
    item = {
      ...item,
      locate: () => {
        locate(layerName, id, pos);
      },
      deleteAction: () => {
        const source = getAnnotationSource(undefined, layerName);
        console.log(source);
        source.delete(source.getReference(id));
      },
      updateAction: (change) => {
        const newProps = {};
        if (change.title !== undefined) {
          newProps.title = change.title;
        }
        if (change.comment !== undefined) {
          newProps.comment = change.comment;
        }
        if (change.type !== undefined) {
          newProps.type = change.type;
        }
        if (newProps) {
          const source = getAnnotationSource(undefined, layerName);
          source.update(source.getReference(id), getNewAnnotation(newAnnotation, newProps));
          source.commit(source.getReference(id));
        }
      },
    };
  }

  return item;
}

export function isValidAnnotation(annotation, dataConfig) {
  const item = getRowItemWithoutAction(annotation);
  const isFieldValid = (field, value) => {
    const column = dataConfig.columns.find((c) => (c.field === field));
    if (column) {
      if (column.checkValidity) {
        return column.checkValidity(value);
      }
    }

    return true;
  };

  return Object.keys(item).every((field) => isFieldValid(field, item[field]));
}
