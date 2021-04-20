/* eslint-disable-next-line  import/prefer-default-export */
export function queryBodyAnnotations(projectUrl, token, datasetKey, query) {
  const url = `${projectUrl}/json-annotations/${datasetKey}/neurons/query`;
  const body = JSON.stringify(query);
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  };

  return fetch(url, options).then(
    (res) => {
      if (res.ok) {
        return res.json();
      }
      const err = `Posting to ${url} failed: ${res.statusText}`;
      throw new Error(err);
    },
  );
}
