/* eslint-disable-next-line  import/prefer-default-export */
async function fetchJson(url, token, method, body) {
  const options = { method };
  if (token) {
    options.headers = { Authorization: `Bearer ${token}` };
  }
  if (body) {
    options.body = body;
  }

  const res = await fetch(url, options);
  if (res.ok) {
    return res.json();
  }

  throw new Error(`${options.method} ${url} failed: ${res.statusText}`);
}

function getBodyAnnotationUrl(projectUrl, dataset, cmd) {
  let url = `${projectUrl}/json-annotations/${dataset.key}/neurons`;
  if (cmd) {
    url += `/${cmd}`;
  }
  if (dataset.tag) {
    url += `?version=${dataset.tag}`;
  }
  return url;
}

export async function getBodyAnnotations(projectUrl, token, dataset, bodies) {
  if (bodies && bodies.length > 0) {
    const url = getBodyAnnotationUrl(projectUrl, dataset, `id-number/${bodies.join(',')}`);
    let annotations = await fetchJson(url, token, 'GET');
    if (annotations) {
      if (!Array.isArray(annotations)) {
        annotations = [annotations];
      }
      bodies.forEach((bodyid) => {
        if (annotations.findIndex((a) => (a.bodyid === bodyid)) < 0) {
          annotations.push({ bodyid });
        }
      });
      return annotations.filter((a) => a.bodyid);
    }
  }

  return [];
}

export function getBodyAnnotation(projectUrl, token, dataset, bodyid) {
  const url = getBodyAnnotationUrl(projectUrl, dataset, `id-number/${bodyid}`);
  return fetchJson(url, token, 'GET').catch(() => (null));
}

export async function queryBodyAnnotations(projectUrl, token, dataset, query) {
  if (Object.keys(query).length === 1 && query.bodyid) {
    return getBodyAnnotations(projectUrl, token, dataset, query.bodyid);
  }

  const url = getBodyAnnotationUrl(projectUrl, dataset, 'query');
  const body = JSON.stringify(query);
  const response = await fetchJson(url, token, 'POST', body);
  if (response) {
    return Object.values(response);
  }

  return [];
}

export async function updateBodyAnnotation(
  projectUrl, token, dataset, annotation, processNewAnnotation,
) {
  if (annotation && annotation.bodyid) {
    const upload = (a) => {
      const processed = { ...a };
      Object.keys(alert).forEach((key) => {
        if (key.startsWith('_')) {
          delete processed[key];
        }
      });

      return fetchJson(getBodyAnnotationUrl(projectUrl, dataset), token, 'POST', JSON.stringify(processed));
    };

    const data = await getBodyAnnotation(projectUrl, token, dataset, annotation.bodyid);
    let newAnnotation = annotation;
    if (data && data.bodyid) {
      newAnnotation = { ...data, ...annotation };
    }

    return upload(newAnnotation).then(
      () => processNewAnnotation(newAnnotation),
    );
  }

  throw new Error('The input annotation is invalid');
}
