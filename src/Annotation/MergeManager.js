export default class MergeManager {
  init = (actions, getNeuroglancerColor, backend) => {
    this.actions = actions;
    this.getNeuroglancerColor = getNeuroglancerColor;
    this.backend = backend;
    if (this.backend) {
      this.restore();
    }
  }

  merge = () => {
    if (this.selection.length > 1) {
      // For now, merge everything onto the first segment selected.
      // Ultimately, it would be better to merge onto the largest selected segment?
      const main = this.selection[0];
      const others = this.selection.slice(1);
      this.mergeData(main, others);

      const equivalences = this.mergeEquivalances();
      this.actions.setViewerSegmentEquivalences(equivalences);

      const colors = this.mergeColors();
      this.actions.setViewerSegmentColors(colors);

      this.selection = [main];
      this.actions.setViewerSegments(this.selection);

      this.store();

      if (this.onMergeChanged) {
        this.onMergeChanged();
      }
    }
  };

  unmerge = () => {
    this.unmergeSelection(true);

    const equivalences = this.mergeEquivalances();
    this.actions.setViewerSegmentEquivalences(equivalences);

    const colors = this.mergeColors();
    this.actions.setViewerSegmentColors(colors);

    this.store();

    if (this.onMergeChanged) {
      this.onMergeChanged();
    }
  };

  clear = () => {
    this.unmergeSelection(false);

    this.mainToOthers = {};
    this.otherToMain = {};

    this.actions.setViewerSegmentEquivalences([]);
    this.actions.setViewerSegmentColors({});

    this.store();

    if (this.onMergeChanged) {
      this.onMergeChanged();
    }
  };

  select = (selectionNow) => {
    this.selection = this.orderedSelection(this.selection, selectionNow);
  };

  isolate = (ids) => {
    this.actions.setViewerSegments(ids);
  }

  onMergeChanged = undefined;

  // Internal

  actions = undefined;

  getNeuroglancerColor = undefined;

  backend = undefined;

  mainToOthers = {};

  otherToMain = {};

  selection = [];

  getUltimateMain = (other) => {
    let curr;
    let next = other;
    do {
      curr = next;
      next = this.otherToMain[curr];
    } while (next);
    return curr;
  };

  mergeData = (mainChosen, others) => {
    const main = this.getUltimateMain(mainChosen);
    if (!Object.prototype.hasOwnProperty.call(this.mainToOthers, main)) {
      this.mainToOthers = { ...this.mainToOthers, [main]: [] };
    }
    others.forEach((other) => {
      if (other !== main) {
        const otherMain = this.getUltimateMain(other);
        this.mainToOthers[main].push(otherMain);
        this.otherToMain[otherMain] = main;
      }
    });

    // Clean up if a self-merge was excluded.
    if (this.mainToOthers[main].length === 0) {
      delete this.mainToOthers[main];
    }
  };

  mergeEquivalances = () => {
    const result = [];
    Object.entries(this.mainToOthers).forEach(([mainStr, others]) => {
      const main = parseInt(mainStr, 10);
      result.push([main, ...others]);
    });
    return result;
  };

  mergeColors = () => {
    const colors = {};
    Object.entries(this.mainToOthers).forEach(([main, others]) => {
      const mainUltimate = this.getUltimateMain(main).toString();
      const color = this.getNeuroglancerColor(mainUltimate);
      colors[main] = color;
      others.forEach((other) => {
        colors[other] = color;
      });
    });
    return colors;
  };

  unmergeSelection = (alsoUpdateMaps) => {
    const selectionNew = [];

    this.selection.forEach((selected) => {
      const main = this.getUltimateMain(selected);
      const others = this.mainToOthers[main];
      if (others) {
        if (alsoUpdateMaps) {
          others.forEach((other) => { delete this.otherToMain[other]; });
          delete this.mainToOthers[main];
        }

        // Select the IDs from the merge in order so that they could be
        // re-merged immediately, if an "undo" is desired.s
        selectionNew.push(main);
        others.forEach((other) => { selectionNew.push(other); });
      } else {
        selectionNew.push(selected);
      }
    });

    this.selection = selectionNew;
    this.actions.setViewerSegments(this.selection);
  }

  orderedSelection = (selectionWas, selectionNow) => {
    const was = this.normalizedSelection(selectionWas);
    const now = this.normalizedSelection(selectionNow);
    const selectionNewlyAdded = now.reduce((a, c) => (
      was.includes(c) ? a : [...a, c]
    ), []);
    const selectionPreserved = was.reduce((a, c) => (
      now.includes(c) ? [...a, c] : a
    ), []);
    return selectionPreserved.concat(selectionNewlyAdded);
  };

  // If ID 1 was merged onto ID 2, then when the merger is selected
  // Neuroglancer will report the selection as `[1]`, using the
  // lower-valued ID.  So renormalize to what we really want, which
  // is `[2]`, using the main ID.s
  normalizedSelection = (selection) => {
    const normalized = selection.map((s) => this.getUltimateMain(s));
    return normalized;
  }

  store = () => {
    this.backend.store(this.mainToOthers, this.otherToMain);
  };

  restore = () => {
    const [mainToOthers, otherToMain] = this.backend.restore();
    this.mainToOthers = mainToOthers;
    this.otherToMain = otherToMain;

    const equivalences = this.mergeEquivalances();
    this.actions.setViewerSegmentEquivalences(equivalences);

    const colors = this.mergeColors();
    this.actions.setViewerSegmentColors(colors);
  };
}
