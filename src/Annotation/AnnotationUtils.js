import React from 'react';

import LocateIcon from '@material-ui/icons/RoomOutlined';
import LocateIconSelected from '@material-ui/icons/Room';
import LineLocateIcon from '@material-ui/icons/PinDropOutlined';
import LineLocateIconSelected from '@material-ui/icons/PinDrop';

import {
  getAnnotationSource,
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

export const ANNOTATION_SHADER = `
#uicontrol vec3 falseSplitColor color(default="#F08040")
#uicontrol vec3 falseMergeColor color(default="#F040F0")
#uicontrol vec3 checkedColor color(default="green")
#uicontrol vec3 borderColor color(default="black")
#uicontrol float pointRadius slider(min=3, max=20, step=1, default=10)
#uicontrol float lineEndRadius slider(min=3, max=20, step=1, default=10)
#uicontrol float lineWidth slider(min=1, max=10, step=1, default=1)
#uicontrol float opacity slider(min=0, max=1, step=0.1, default=1)
#uicontrol float opacity3D slider(min=0, max=1, step=0.1, default=0.2)
#uicontrol vec3 defaultPointColor color(default="#FF0000")
#uicontrol vec3 lineColor color(default="#FF0000")
#uicontrol vec3 sphereColor color(default="red")
#uicontrol float sphereAnnotationOpacity slider(min=0, max=1, step=0.1, default=1)
void main() {
  setPointMarkerSize(pointRadius);
  setEndpointMarkerSize(lineEndRadius);
  setLineWidth(lineWidth);
  float finalOpacity = PROJECTION_VIEW ? opacity3D : opacity;
  setPointMarkerBorderColor(vec4(borderColor, finalOpacity));
  if (prop_rendering_attribute() == 1) {
    setColor(vec4(checkedColor, finalOpacity));
  } else if (prop_rendering_attribute() == 2) {
    setColor(vec4(falseSplitColor, finalOpacity));
  } else if (prop_rendering_attribute() == 3)  {
    setColor(vec4(falseMergeColor, finalOpacity));
  } else {
    setColor(vec4(defaultPointColor, finalOpacity));
  }
  setLineColor(lineColor, lineColor);
  setEndpointMarkerColor(lineColor);
  float finalSphereAnnotationOpacity = sphereAnnotationOpacity;
  if (prop_rendering_attribute() != 11) {
    finalSphereAnnotationOpacity = 1.0;
  }
  setSphereColor(vec4(sphereColor, finalSphereAnnotationOpacity));
  setAxisColor(vec4(sphereColor, finalSphereAnnotationOpacity));
  setAxisEndpointMarkerColor(vec4(sphereColor, finalSphereAnnotationOpacity));
}`;

export const ATLAS_SHADER = `
#uicontrol vec3 borderColor color(default="black")
#uicontrol float pointRadius slider(min=3, max=20, step=1, default=10)
#uicontrol float opacity slider(min=0, max=1, step=0.1, default=1)
#uicontrol float opacity3D slider(min=0, max=1, step=0.1, default=0.2)
#uicontrol vec3 defaultPointColor color(default="#8080FF")
void main() {
  setPointMarkerSize(pointRadius);
  float finalOpacity = PROJECTION_VIEW ? opacity3D : opacity;
  setPointMarkerBorderColor(vec4(borderColor, finalOpacity));
  if (prop_rendering_attribute() == 1) {
    setColor(vec4(defaultPointColor, 0.1));
  } else {
    setColor(vec4(defaultPointColor, finalOpacity));
  }
}`;

export function getAnnotationIcon(kind, action, selected) {
  if (action === 'locate') {
    if (kind === 'line') {
      return selected ? <LineLocateIconSelected /> : <LineLocateIcon />;
    }

    return selected ? <LocateIconSelected /> : <LocateIcon />;
  }

  return null;
}

export function getNewAnnotation(annotation, prop) {
  const newAnnotation = { ...annotation };
  newAnnotation.prop = { ...newAnnotation.prop, ...prop };
  return newAnnotation;
}

function getPointAnnotationPos(annotation) {
  return [annotation.point[0], annotation.point[1], annotation.point[2]];
}

function getLineAnnotationPos(annotation) {
  return [
    Math.round((annotation.pointA[0] + annotation.pointB[0]) / 2),
    Math.round((annotation.pointA[1] + annotation.pointB[1]) / 2),
    Math.round((annotation.pointA[2] + annotation.pointB[2]) / 2),
  ];
}

const KIND_MAP = {
  0: 'point',
  1: 'line',
};

export function getAnnotationPos(annotation) {
  switch (annotation.type) {
    case 0:
      return getPointAnnotationPos(annotation);
    case 1:
      return getLineAnnotationPos(annotation);
    default:
      break;
  }

  return null;
}

function getRowItemWithoutAction(annotation) {
  const { id } = annotation;
  const pos = getAnnotationPos(annotation);
  const { comment, type, title } = annotation.prop ? annotation.prop : { comment: '', type: '', title: '' };

  return {
    id,
    kind: KIND_MAP[annotation.type],
    pos: `(${pos.join(',')})`,
    title: title || '',
    comment: comment || '',
    type: type || '',
  };
}

export function getRowItemFromAnnotation(annotation, config) {
  let item = getRowItemWithoutAction(annotation);
  if (item) { // point annotation
    const { layerName, locate } = config;
    const newAnnotation = { ...annotation };
    const { id } = annotation;
    const pos = getAnnotationPos(annotation);
    item = {
      ...item,
      locateAction: () => {
        locate(layerName, id, pos);
      },
      deleteAction: () => {
        const source = getAnnotationSource(undefined, layerName);
        // console.log(source);
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
          locate(layerName, id, pos);
        }
      },
    };
  }

  return item;
}

export function isValidAnnotation(annotation, dataConfig) {
  const item = getRowItemWithoutAction(annotation);
  if (!item) {
    return false;
  }

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
