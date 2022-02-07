export default class MergeBackendCloud {
  constructor(dataset, projectUrl, getToken, addAlert) {
    this.dataset = dataset;
    this.projectUrl = projectUrl;
    this.getToken = getToken;
    this.addAlert = addAlert;
  }

  // getToken = () => this.user.getAuthResponse().id_token;

  store = (mainToOthers, otherToMain) => {
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json',
      },
    };
    options.body = JSON.stringify(mainToOthers);
    let url = this.urlMainToOthers();
    fetch(url, options)
      .then((res1) => {
        if (res1.ok) {
          options.body = JSON.stringify(otherToMain);
          url = this.urlOtherToMain();
          return (fetch(url, options)
            .then((res2) => {
              if (res2.ok) {
                return (res2.json());
              }
              const err2 = `Posting to ${url} failed: ${res2.statusText}`;
              throw new Error(err2);
            }));
        }
        const err1 = `Posting to ${url} failed: ${res1.statusText}`;
        throw new Error(err1);
      })
      .catch((exc) => {
        this.addAlert({ severity: 'error', message: exc.message });
      });
  }

  restore = () => {
    let mainToOthers = {};
    let otherToMain = {};

    const options = {
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json',
      },
    };
    let url = this.urlMainToOthers();
    return (fetch(url, options)
      .then((res1) => {
        if (res1.ok) {
          return (res1.json());
        }
        if (res1.status === 404) {
          return ({});
        }
        const err1 = `Getting from ${url} failed: ${res1.statusText}`;
        throw new Error(err1);
      })
      .then((res1Json) => {
        mainToOthers = res1Json || {};
        url = this.urlOtherToMain();
        return (fetch(url, options)
          .then((res2) => {
            if (res2.ok) {
              return (res2.json());
            }
            if (res2.status === 404) {
              return ({});
            }
            const err2 = `Getting from ${url} failed: ${res2.statusText}`;
            throw new Error(err2);
          })
          .then((res2Json) => {
            otherToMain = res2Json || {};
            return new Promise((resolve) => { resolve([mainToOthers, otherToMain]); });
          }));
      })
      .catch((exc) => {
        this.addAlert({ severity: 'error', message: exc.message });
        return new Promise((resolve) => { resolve([{}, {}]); });
      }));
  }

  pullRequest = () => {
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json',
      },
    };
    options.body = JSON.stringify({
      pull: this.pullRequestBody(),
    });
    const url = this.urlPullRequest();
    return (fetch(url, options)
      .then((res) => {
        if (res.ok) {
          return (res.json());
        }
        const err = `Posting to ${url} failed: ${res.statusText}`;
        throw new Error(err);
      })
      .catch((exc) => {
        this.addAlert({ severity: 'error', message: exc.message });
      }));
  }

  // Internal

  datasetName = () => {
    if (this.dataset.tag) {
      return `${this.dataset.key}-${this.dataset.tag}`;
    }
    return this.dataset.key;
  }

  scope = () => `merges-${this.datasetName()}`;

  urlBase = () => `${this.projectUrl}/kv/${this.scope()}`;

  urlMainToOthers = () => `${this.urlBase()}/mainToOthers`;

  urlOtherToMain = () => `${this.urlBase()}/otherToMain`;

  urlPullRequest = () => `${this.projectUrl}/pull-request`;

  pullRequestBody = () => `kv/${this.scope()}/mainToOthers`;
}
