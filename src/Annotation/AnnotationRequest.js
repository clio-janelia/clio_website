import {
  getAnnotationPos,
  getAnnotationDescription,
} from './AnnotationUtils';
import {
  getMergeableLayerFromDataset,
  getLayerSourceUrl,
  parseDvidSource,
} from '../utils/neuroglancer';

/* eslint-disable-next-line  import/prefer-default-export */
async function fetchJson(url, token, method, body) {
  const options = { method: method || 'GET' };
  if (token) {
    options.headers = { Authorization: `Bearer ${token}` };
  }
  if (body) {
    options.body = body;
    options.headers = {
      ...options.headers,
      'Content-Type': 'application/json',
    };
  }

  const res = await fetch(url, options);
  if (res.ok) {
    return res.json();
  }

  throw new Error(`${options.method} ${url} failed: ${res.statusText || res.detail || 'error message not available.'}`);
}

function getBodyAnnotationUrl(projectUrl, dataset, cmd, searchParams) {
  const url = new URL(`${projectUrl}/json-annotations/${dataset.key}/neurons`);
  if (cmd) {
    url.pathname += `/${cmd}`;
  }
  if (dataset.tag) {
    url.searchParams.append('version', dataset.tag);
  }
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  return url.toString();
}

function fillBodyAnnotations(annotations, bodies) {
  ((typeof bodies === 'number') ? [bodies] : bodies).forEach((bodyid) => {
    if (annotations.findIndex((a) => (a.bodyid === bodyid)) < 0) {
      annotations.push({ bodyid });
    }
  });
  return annotations.filter((a) => a.bodyid);
}

export async function getBodyAnnotations(projectUrl, token, dataset, bodies) {
  if (bodies && bodies.length > 0) {
    const url = getBodyAnnotationUrl(projectUrl, dataset, `id-number/${bodies.join(',')}`);
    let annotations = await fetchJson(url, token, 'GET');
    if (annotations) {
      if (!Array.isArray(annotations)) {
        annotations = [annotations];
      }
      return fillBodyAnnotations(annotations, bodies);
    }
  }

  return [];
}

export async function getBodyAnnotation(projectUrl, token, dataset, bodyid) {
  const url = getBodyAnnotationUrl(projectUrl, dataset, `id-number/${bodyid}`);
  try {
    const data = await fetchJson(url, token, 'GET');
    if (data && data.length > 0) {
      return data[0];
    }
  } catch {
    return null;
  }

  return null;
}

export async function queryBodyAnnotations(projectUrl, token, dataset, query) {
  if (Object.keys(query).length === 1 && query.bodyid) {
    let { bodyid } = query;
    if (typeof bodyid === 'number') {
      bodyid = [bodyid];
    }
    return getBodyAnnotations(projectUrl, token, dataset, bodyid);
  }

  const url = getBodyAnnotationUrl(projectUrl, dataset, 'query');
  const body = JSON.stringify(query);
  const response = await fetchJson(url, token, 'POST', body);
  if (response) {
    const annotations = Object.values(response);
    if (Object.keys(query).length === 1 && query.bodyid) {
      return fillBodyAnnotations(annotations, query.bodyid);
    }
    return annotations;
  }

  return [];
}

export async function updateBodyAnnotation(
  projectUrl, token, user, dataset,
  annotation,
  processNewAnnotation,
  validateUpdate,
) {
  if (annotation && annotation.bodyid) {
    const upload = (a) => {
      const processed = { ...a };
      Object.keys(alert).forEach((key) => {
        if (key.startsWith('_')) {
          delete processed[key];
        }
      });

      return fetchJson(
        getBodyAnnotationUrl(projectUrl, dataset, undefined, { replace: 'true' }),
        token,
        'POST',
        JSON.stringify(processed),
      );
    };

    const data = await getBodyAnnotation(projectUrl, token, dataset, annotation.bodyid);
    let newAnnotation = { ...annotation };

    if (data && data.bodyid) {
      newAnnotation = { ...data, ...newAnnotation };
    }

    if (validateUpdate) {
      newAnnotation = validateUpdate(newAnnotation);
    }

    return upload(newAnnotation).then(
      () => {
        if (processNewAnnotation) {
          processNewAnnotation(newAnnotation);
        }
      },
    );
  }

  throw new Error('The input annotation is invalid');
}

export async function pointToBodyAnnotation(
  {
    projectUrl, token, user, dataset,
  },
  pointAnnotation,
) {
  const pos = getAnnotationPos(pointAnnotation);
  const segmentationLayer = getMergeableLayerFromDataset(dataset);
  if (segmentationLayer) {
    const sourceUrl = getLayerSourceUrl(segmentationLayer);
    const dvidConfig = parseDvidSource(sourceUrl);
    if (dvidConfig) {
      const labelUrl = `${dvidConfig.protocol}://${dvidConfig.host}/api/node/${dvidConfig.uuid}/${dvidConfig.dataInstance}/label/${pos.join('_')}`;
      const label = await fetchJson(labelUrl);
      if (label && label.Label) {
        const newAnnotation = {
          bodyid: label.Label,
          position: pos,
          position_type: 'user',
        };

        let pointDescription = getAnnotationDescription(pointAnnotation);
        if (pointDescription) {
          pointDescription = `●${pointDescription} @(${pos.join(',')})`;
        } else {
          pointDescription = '';
        }

        const validateUpdate = (annotation) => {
          if (annotation.description
            && pointDescription
            && annotation.description.indexOf(pointDescription) >= 0) {
            throw Error('already transformed.');
          }
          let newDescription = pointDescription;
          if (annotation.description) {
            const regex = new RegExp(`●[^●]*@\\(${pos.join(',')}\\)`);
            if (regex.test(annotation.description)) {
              newDescription = annotation.description.replace(regex, pointDescription);
            } else if (pointDescription) {
              newDescription = `${annotation.description} ${pointDescription}`;
            }
          }

          return {
            ...annotation,
            description: newDescription,
          };
        };

        return updateBodyAnnotation(
          projectUrl, token, user, dataset, newAnnotation, null, validateUpdate,
        ).then(
          () => newAnnotation,
        );
      }
    }
  }

  throw Error('The annotation cannot be transformed under current settings.');
}
