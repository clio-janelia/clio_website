import localStorageAvailable from '../utils/storage';

const KEY_MAIN_TO_OTHERS = 'CLIO-MERGE-MAIN-TO-OTHERS';
const KEY_OTHER_TO_MAIN = 'CLIO-MERGE-OTHER-TO-MAIN';
const KEY_MAIN_ORDERED = 'CLIO-MERGE-MAIN-ORDERED';


export default class MergeBackendLocal {
  constructor(dataset) {
    this.dataset = dataset;
  }

  store = (mainToOthers, otherToMain, mainOrdered) => {
    if (localStorageAvailable) {
      localStorage.setItem(KEY_MAIN_TO_OTHERS, JSON.stringify(mainToOthers));
      localStorage.setItem(KEY_OTHER_TO_MAIN, JSON.stringify(otherToMain));
      localStorage.setItem(KEY_MAIN_ORDERED, JSON.stringify(mainOrdered));
    }
  }

  restore = () => {
    let mainToOthers = {};
    let otherToMain = {};
    let mainOrdered = [];
    if (localStorageAvailable) {
      const mainToOthersStr = localStorage.getItem(KEY_MAIN_TO_OTHERS);
      const otherToMainStr = localStorage.getItem(KEY_OTHER_TO_MAIN);
      const mainOrderedStr = localStorage.getItem(KEY_MAIN_ORDERED);
      mainToOthers = JSON.parse(mainToOthersStr) || mainToOthers;
      otherToMain = JSON.parse(otherToMainStr) || otherToMain;
      mainOrdered = JSON.parse(mainOrderedStr) || mainOrdered;
    }
    return new Promise((resolve) => { resolve([mainToOthers, otherToMain, mainOrdered]); });
  }
}
