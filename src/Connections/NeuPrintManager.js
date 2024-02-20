export default class NeuPrintManager {
  constructor(dataset, projectUrl, getToken) {
    this.dataset = dataset;
    this.projectUrl = projectUrl;
    this.getToken = getToken;
  }

  getConnections = (ids, which) => {
    let cypher;
    if (which === 'pre') {
      cypher = 'MATCH (m :Neuron)-[e:ConnectsTo]->(n :Neuron) ';
    } else {
      cypher = 'MATCH (m :Neuron)<-[e:ConnectsTo]-(n :Neuron) ';
    }
    cypher += `WHERE m.bodyId in [${ids}] `
      + 'RETURN n.bodyId AS id, n.type AS type, sum(e.weight) AS weight '
      + 'ORDER BY weight DESC, id';

    return (this.doQuery(cypher)
      .then((resJson) => {
        if (resJson) {
          const result = resJson.data.map((item) => (
            { id: item[0], type: item[1], weight: item[2] }
          ));
          return new Promise((resolve) => { resolve(result); });
        }
        return new Promise((resolve) => { resolve([]); });
      })
    );
  }

  getTypes = (ids) => {
    const cypher = 'MATCH (n: Neuron) '
      + `WHERE n.bodyId in [${ids}] `
      + 'RETURN n.bodyId AS id, n.type AS type';

    return (this.doQuery(cypher)
      .then((resJson) => {
        if (resJson && resJson.data) {
          const result = resJson.data.map((item) => (
            { id: item[0], type: item[1] }
          ));
          return new Promise((resolve) => { resolve(result); });
        }
        return new Promise((resolve) => { resolve([]); });
      })
    );
  }

  // Internal

  doQuery = (cypher) => {
    if (!this.dataset) {
      return Promise.reject(new Error('No dataset specified for neuPrint query.'));
    }

    const url = `${this.projectUrl}/neuprint/${this.dataset.key}`;

    let dataset = `${this.dataset.key}`;
    if (this.dataset.tag) {
      // make sure the dataset key doesn't already have the tag at the end
      if (!this.dataset.key.endsWith(`:${this.dataset.tag}`)) {
        dataset = `${dataset}:${this.dataset.tag}`;
      }
    }

    const body = JSON.stringify({ cypher, dataset });
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getToken()}`,
      },
      body,
    };

    return (fetch(url, options)
      .then((res) => {
        if (res.ok) {
          return (res.json());
        }
        return res.json().then((resJson) => {
          const err = `Getting from ${url} failed: ${res.statusText} ${resJson.detail || ''}`;
          throw new Error(err);
        });
      }));
  }
}
