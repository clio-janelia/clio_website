export default class MergeBackendCloud {
  constructor(dataset, projectUrl, getToken, addAlert) {
    this.dataset = dataset;
    this.projectUrl = projectUrl;
    this.getToken = getToken;
    this.addAlert = addAlert;
  }

  // getToken = () => this.user.getAuthResponse().id_token;

  store = (mainToOthers, otherToMain, mainOrdered) => {
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
          fetch(url, options)
            .then((res2) => {
              if (res2.ok) {
                // If cloud backend `kv` supports POST bodies that are ordinary arrays:
                // options.body = JSON.stringify(mainOrdered);

                const mainOrderedObj = { array: mainOrdered };
                options.body = JSON.stringify(mainOrderedObj);

                url = this.urlMainOrdered();
                fetch(url, options)
                  .then((res3) => {
                    if (!res3.ok) {
                      const err3 = `Posting to ${url} failed: ${res3.statusText}`;
                      throw new Error(err3);
                    }
                  });
              } else {
                const err2 = `Posting to ${url} failed: ${res2.statusText}`;
                throw new Error(err2);
              }
            });
        } else {
          const err1 = `Posting to ${url} failed: ${res1.statusText}`;
          throw new Error(err1);
        }
      })
      .catch((exc) => {
        this.addAlert({ severity: 'error', message: exc.message });
      });
  }

  restore = () => {
    let mainToOthers = {};
    let otherToMain = {};
    let mainOrdered = [];

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
            const err2 = `Getting from ${url} failed: ${res2.statusText}`;
            throw new Error(err2);
          })
          .then((res2Json) => {
            otherToMain = res2Json || {};
            url = this.urlMainOrdered();
            return (fetch(url, options)
              .then((res3) => {
                if (res3.ok) {
                  return (res3.json());
                }
                const err3 = `Getting from ${url} failed: ${res3.statusText}`;
                throw new Error(err3);
              })
              .then((res3Json) => {
                // If cloud backend `kv` supports POST bodies that are ordinary arrays:
                // mainOrdered = res3Json.array || [];

                mainOrdered = res3Json.array || [];

                return new Promise((resolve) => {
                  resolve([mainToOthers, otherToMain, mainOrdered]);
                });
              }));
          }));
      })
      .catch((exc) => {
        this.addAlert({ severity: 'error', message: exc.message });
        return new Promise((resolve) => { resolve([{}, {}, []]); });
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

  urlMainOrdered = () => `${this.urlBase()}/mainOrdered`;

  urlPullRequest = () => `${this.projectUrl}/pull-request`;

  pullRequestBody = () => `kv/${this.scope()}/mainToOthers`;
}
