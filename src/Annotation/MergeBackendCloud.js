const SCOPE = 'merges';
const KEY_MAIN_TO_OTHERS = 'mainToOthers';
const KEY_OTHER_TO_MAIN = 'otherToMain';

export default class MergeBackendCloud {
  constructor(datasetName, token, addAlert) {
    this.datasetName = datasetName;
    this.token = token;
    this.addAlert = addAlert;
  }

  store = (mainToOthers, otherToMain) => {
    const urlBase = `https://clio-store-vwzoicitea-uk.a.run.app/clio_toplevel/kv/${this.datasetName}/${SCOPE}`;
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    };
    options.body = JSON.stringify(mainToOthers);
    let url = `${urlBase}/${KEY_MAIN_TO_OTHERS}`;
    fetch(url, options)
      .then((res1) => {
        if (res1.ok) {
          options.body = JSON.stringify(otherToMain);
          url = `${urlBase}/${KEY_OTHER_TO_MAIN}`;
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

    const urlBase = `https://clio-store-vwzoicitea-uk.a.run.app/clio_toplevel/kv/${this.datasetName}/${SCOPE}`;
    const options = {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    };
    let url = `${urlBase}/${KEY_MAIN_TO_OTHERS}`;
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
        url = `${urlBase}/${KEY_OTHER_TO_MAIN}`;
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
      }));
  }
}
