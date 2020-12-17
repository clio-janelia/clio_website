import localStorageAvailable from '../utils/storage';

const KEY_MAIN_TO_OTHERS = 'CLIO-MERGE-MAIN-TO-OTHERS';
const KEY_OTHER_TO_MAIN = 'CLIO-MERGE-OTHER-TO-MAIN';

export default class MergeBackendLocal {
  store = (mainToOthers, otherToMain) => {
    if (localStorageAvailable) {
      localStorage.setItem(KEY_MAIN_TO_OTHERS, JSON.stringify(mainToOthers));
      localStorage.setItem(KEY_OTHER_TO_MAIN, JSON.stringify(otherToMain));
    }
  }

  restore = () => {
    let mainToOthers = {};
    let otherToMain = {};
    if (localStorageAvailable) {
      const mainToOthersStr = localStorage.getItem(KEY_MAIN_TO_OTHERS);
      const otherToMainStr = localStorage.getItem(KEY_OTHER_TO_MAIN);
      mainToOthers = JSON.parse(mainToOthersStr) || mainToOthers;
      otherToMain = JSON.parse(otherToMainStr) || otherToMain;
    }
    return [mainToOthers, otherToMain];
  }
}
