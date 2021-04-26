import React from 'react';

import LocateIcon from '@material-ui/icons/RoomOutlined';
import LocateIconSelected from '@material-ui/icons/Room';
import LineLocateIcon from '@material-ui/icons/PinDropOutlined';
import LineLocateIconSelected from '@material-ui/icons/PinDrop';

import {
  getAnnotationSource,
  parseUrlHash,
} from '@janelia-flyem/react-neuroglancer';

import { hasMergeableLayer } from '../utils/neuroglancer';

export const ANNOTATION_COLUMNS = {
  type: {
    title: 'Type',
    filterEnabled: true,
    editElement: {
      type: 'select',
      options: [
        {
          label: 'None',
          value: null,
        },
        {
          label: 'Merge',
          value: 'Merge',
        },
        {
          label: 'Split',
          value: 'Split',
        },
      ],
    },
    rank: 1,
  },
  comment: {
    title: 'Description',
    filterEnabled: true,
    editElement: {
      type: 'input',
    },
    rank: 2,
  },
  pos: {
    title: 'Position',
    rank: 3,
  },
  user: {
    title: 'User',
    filterEnabled: true,
    rank: 4,
  },
};

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
//#uicontrol vec3 sphereColor color(default="red")
//#uicontrol float sphereAnnotationOpacity slider(min=0, max=1, step=0.1, default=1)
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
  /*
  float finalSphereAnnotationOpacity = sphereAnnotationOpacity;
  if (prop_rendering_attribute() != 11) {
    finalSphereAnnotationOpacity = 1.0;
  }
  setSphereColor(vec4(sphereColor, finalSphereAnnotationOpacity));
  setAxisColor(vec4(sphereColor, finalSphereAnnotationOpacity));
  setAxisEndpointMarkerColor(vec4(sphereColor, finalSphereAnnotationOpacity));
  */
}`;

export const ATLAS_SHADER = `
#uicontrol vec3 borderColor color(default="black")
#uicontrol float pointRadius slider(min=3, max=20, step=1, default=10)
#uicontrol float opacity slider(min=0, max=1, step=0.1, default=1)
#uicontrol float opacity3D slider(min=0, max=1, step=0.1, default=0.2)
#uicontrol vec3 defaultPointColor color(default="#8080FF")
#uicontrol vec3 checkedPointColor color(default="#008040")
void main() {
  setPointMarkerSize(pointRadius);
  float finalOpacity = PROJECTION_VIEW ? opacity3D : opacity;
  setPointMarkerBorderColor(vec4(borderColor, finalOpacity));
  if (prop_rendering_attribute() == -1) {
    setColor(vec4(defaultPointColor, 0.1));
  } else if (prop_rendering_attribute() == 1) {
    setColor(vec4(checkedPointColor, finalOpacity));
  } else {
    setColor(vec4(defaultPointColor, finalOpacity));
  }
}`;

export function getAnnotationIcon(kind, action, selected) {
  if (action === 'locate') {
    if (kind === 'lineseg') {
      return selected ? <LineLocateIconSelected /> : <LineLocateIcon />;
    }

    return selected ? <LocateIconSelected /> : <LocateIcon />;
  }

  return null;
}

export function getBodyAnnotationColumnSetting(dataset) {
  if (dataset) {
    // FIXME: Temporary schema handling
    if (dataset.bodyAnnotationSchema) {
      return dataset.bodyAnnotationSchema;
    }

    if (dataset.name === 'hemibrain') {
      return {
        shape: ['bodyid', 'type', 'instance', 'cell_body_fiber', 'comment'],
        collection: {
          bodyid: {
            title: 'Body ID',
            filterEnabled: true,
            rank: 1,
          },
          type: {
            title: 'Type',
            filterEnabled: true,
            editElement: {
              type: 'input',
            },
            rank: 2,
          },
          instance: {
            title: 'Instance',
            filterEnabled: true,
            editElement: {
              type: 'input',
            },
            rank: 3,
          },
          cell_body_fiber: {
            title: 'Cell Body Fiber',
            filterEnabled: true,
            editElement: {
              type: 'input',
            },
            rank: 4,
          },
          flyem_status: {
            title: 'Status',
            filterEnabled: true,
            rank: 5,
          },
          comment: {
            title: 'Comment',
            filterEnabled: true,
            editElement: {
              type: 'input',
            },
            rank: 6,
          },
        },
      };
    }

    if (dataset.key === 'VNC') {
      return {
        shape: ['bodyid', 'class', 'hemilineage', 'soma_side', 'description'],
        collection: {
          bodyid: {
            title: 'Body ID',
            filterEnabled: true,
            rank: 1,
          },
          class: {
            title: 'Class',
            filterEnabled: true,
            editElement: {
              type: 'input',
            },
            rank: 2,
          },
          hemilineage: {
            title: 'Hemilineage',
            filterEnabled: true,
            editElement: {
              type: 'input',
            },
            rank: 3,
          },
          soma_side: {
            title: 'Soma Side',
            filterEnabled: true,
            editElement: {
              type: 'input',
            },
            rank: 4,
          },
          soma_neuromere: {
            title: 'Soma Neuromere',
            filterEnabled: true,
            editElement: {
              type: 'input',
            },
            rank: 5,
          },
          entry_nerve: {
            title: 'Entry Nerve',
            filterEnabled: true,
            editElement: {
              type: 'input',
            },
            rank: 6,
          },
          description: {
            title: 'Description',
            filterEnabled: true,
            editElement: {
              type: 'input',
            },
            rank: 7,
          },
        },
      };
    }
  }

  return null;
}

export function getAnnotationColumnSetting(dataset) {
  let shape = ['comment', 'pos'];
  if (hasMergeableLayer(dataset)) {
    shape = ['type', ...shape];
  }

  return {
    shape,
    collection: ANNOTATION_COLUMNS,
  };
}

export function getNewAnnotation(annotation, prop) {
  const newAnnotation = { ...annotation };
  const newProp = { ...prop };
  if (newAnnotation.ext) {
    // newAnnotation.ext = { ...newAnnotation.ext, ...prop };
    if (newProp.comment !== undefined) {
      newAnnotation.ext.description = newProp.comment;
      delete newProp.comment;
    }
    if (newProp.title !== undefined) {
      newAnnotation.ext.title = newProp.title;
      delete newProp.title;
    }
    if (!newProp.type) {
      delete newProp.type;
      if (newAnnotation.prop) {
        delete newAnnotation.prop.type;
      }
    }
  }

  newAnnotation.prop = { ...newAnnotation.prop, ...newProp };

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
  1: 'lineseg',
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

export function encodeAnnotation(annotation) {
  let encodedObj = {
    kind: KIND_MAP[annotation.type],
  };

  switch (encodedObj.kind) {
    case 'point':
      encodedObj.pos = [...annotation.point];
      break;
    case 'lineseg':
      encodedObj.pos = [...annotation.pointA, ...annotation.pointB];
      break;
    default:
      return null;
  }

  if (annotation.prop) {
    encodedObj.prop = annotation.prop;
  }

  if (annotation.ext) {
    encodedObj = {
      ...encodedObj,
      ...annotation.ext,
    };
  }

  return encodedObj;
}

function getAnnotationTimestamp(annotation) {
  if (annotation.prop && annotation.prop.timestamp) {
    return Number(annotation.prop.timestamp);
  }

  return 0;
}

function getRowItemWithoutAction(annotation) {
  const { id } = annotation;
  const pos = getAnnotationPos(annotation);
  const prop = {
    comment: '', type: '', title: '', ...annotation.prop, ...annotation.ext,
  };
  if (prop.description) {
    prop.comment = prop.description;
  }
  const {
    comment, type, title, user,
  } = prop;

  return {
    id,
    kind: KIND_MAP[annotation.type],
    pos: `(${pos.join(',')})`,
    title: title || '',
    comment: comment || '',
    type: type || '',
    user,
    timestamp: getAnnotationTimestamp(annotation),
    defaultEditing: false,
    _annotation: annotation,
  };
}

function getAnnotationUser(annotation) {
  return annotation && (annotation.user || (annotation.ext && annotation.ext.user));
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
    };
    let { verified } = annotation;
    if (verified === undefined) {
      verified = annotation.ext ? annotation.ext.verified : false;
    }
    if (!verified && config.user && (config.user === getAnnotationUser(annotation))) {
      item.deleteAction = () => {
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
      };
      item.updateAction = (change) => {
        if (Object.keys(change).length > 0) {
          const source = getAnnotationSource(undefined, layerName);
          if (source) {
            source.update(source.getReference(id), getNewAnnotation(newAnnotation, change));
            source.commit(source.getReference(id));
            locate(layerName, id, pos);
          }
        }
      };
    }
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

function getAnnotationFormat(entry) {
  if ('pos' in entry) {
    return 'clio';
  }

  if ('Pos' in entry && entry.Kind === 'Note') {
    return 'dvid';
  }

  if (entry.type === 'point') {
    return 'ngpoint';
  }

  if (entry.type === 'lineseg') {
    return 'ngline';
  }

  return undefined;
}

function dvidBookmarkToAnnotation(bookmark) {
  if (bookmark.Kind === 'Note') {
    const annotation = {
      kind: 'point',
      pos: bookmark.Pos,
    };

    const prop = bookmark.Prop;
    if (prop) {
      if (prop.comment) {
        annotation.description = prop.comment;
        delete prop.comment;
      }

      delete prop.custom;

      Object.keys(prop).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(prop, key)) {
          if (!prop[key]) {
            delete prop[key];
          }
        }
      });
    }
    annotation.prop = prop;

    return annotation;
  }

  return null;
}

function round(array) {
  return array.map((v) => Math.round(v));
}

const convertAnnotation = {
  clio: (entry) => entry,
  dvid: dvidBookmarkToAnnotation,
  ngpoint: (entry) => {
    if ('point' in entry) {
      const annotation = {
        kind: 'point',
        pos: round(entry.point),
      };
      if (entry.description) {
        annotation.description = entry.description;
      }
      return annotation;
    }

    return null;
  },
  ngline: (entry) => {
    if ('pointA' in entry && 'pointB' in entry) {
      const annotation = {
        kind: 'lineseg',
        pos: round([...entry.pointA, ...entry.pointB]),
      };
      if (entry.description) {
        annotation.description = entry.description;
      }
      return annotation;
    }

    return null;
  },
};

function entryToAnnotation(entry) {
  const convert = convertAnnotation[getAnnotationFormat(entry)];
  if (convert) {
    return convert(entry);
  }

  return null;
}

function extractAnnotationArray(obj) {
  if (Array.isArray(obj)) {
    return obj;
  }

  if ('annotations' in obj) {
    return obj.annotations;
  }

  if ('layers' in obj) {
    const { layers } = obj;
    let annotations = [];
    layers.forEach((layer) => {
      if (layer.source && layer.source.url === 'local://annotations') {
        annotations = annotations.concat(extractAnnotationArray(layer));
      }
    });
    return annotations;
  }

  return obj;
}

function extractAnnotationJsonFromUrls(buffer) {
  const lines = buffer.split('\n');
  let annotations = [];
  lines.forEach((line) => {
    const spec = parseUrlHash(line);
    const annotationGroup = extractAnnotationArray(spec);
    if (annotationGroup) {
      annotations = annotations.concat(annotationGroup);
    }
  });

  return annotations;
}

export function toAnnotationPayload(buffer, user) {
  let obj = [];
  try {
    obj = extractAnnotationArray(JSON.parse(buffer));
  } catch (_) {
    obj = extractAnnotationJsonFromUrls(buffer);
  }

  const annotations = [];

  Object.values(obj).forEach((entry) => {
    const newEntry = entryToAnnotation(entry);

    if (newEntry) {
      if (!newEntry.prop) {
        newEntry.prop = {};
      }

      if (newEntry.user && newEntry.user !== user) {
        newEntry.prop.user = newEntry.user;
      }
      if (user) {
        newEntry.user = user;
      } else {
        delete newEntry.user;
      }

      annotations.push(newEntry);
    } else {
      console.log(`Skipping ${entry}`);
    }
  });

  return JSON.stringify(annotations);
}

export function getAnnotationUrl(sourceParameters) {
  return `${sourceParameters.baseUrl}/${sourceParameters.api}/${(sourceParameters.kind === 'Atlas') ? 'atlas' : 'annotations'}/${sourceParameters.dataset}`;
}

export function getAnnotationUrlWithGroups(url, groups) {
  const matched = url.match(/(.*:\/\/)(.*:\/\/.*)/);
  const newUrl = new URL(matched ? matched[2] : url);
  if (groups && groups.length > 0) {
    newUrl.searchParams.set('groups', groups.join(','));
  } else {
    newUrl.searchParams.delete('groups');
  }

  return `${(matched ? matched[1] : '') + newUrl.href}`;
}

export function getGroupsFromAnnotationUrl(aurl) {
  if (aurl) {
    const matched = aurl.match(/(.*:\/\/)(.*:\/\/.*)/);
    const url = new URL(matched ? matched[2] : aurl);
    const groupQuery = url.searchParams.get('groups');
    if (groupQuery) {
      return groupQuery.split(',');
    }
  }

  return [];
}

export function getUrlFromLayer(layer) {
  if (layer && layer.source) {
    if (typeof layer.source === 'string') {
      return layer.source;
    }

    return layer.source.url;
  }

  return undefined;
}

export function getAnnotationToolFromLayer(layer) {
  return layer && layer.tool;
}

export function getGroupsFromAnnotationLayer(layer) {
  const url = getUrlFromLayer(layer);
  if (url) {
    return getGroupsFromAnnotationUrl(url);
  }

  return [];
}
