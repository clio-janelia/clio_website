/* eslint-disable-next-line  import/prefer-default-export */
export function queryBodyAnnotations(projectUrl, token, dataset, query) {
  const url = `${projectUrl}/json-annotations/${dataset.key}/neurons/query${dataset.tag ? `?version=${dataset.tag}` : ''}`;
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
