export default class NeuPrintManager {
  init = (dataset, projectUrl, token, addAlert) => {
    this.dataset = dataset;
    this.projectUrl = projectUrl;
    this.token = token;
    this.addAlert = addAlert;
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
    const url = `${this.projectUrl}/neuprint/${this.dataset.key}`;

    let dataset = `${this.dataset.key}`;
    if (this.dataset.tag) {
      dataset = `${dataset}:${this.dataset.tag}`;
    }

    const body = JSON.stringify({ cypher, dataset });
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body,
    };

    return (fetch(url, options)
      .then((res) => {
        if (res.ok) {
          return (res.json());
        }
        const err = `Getting from ${url} failed: ${res.statusText}`;
        throw new Error(err);
      })
      .catch((exc) => {
        this.addAlert({ severity: 'error', message: exc.message });
      }));
  }
}
