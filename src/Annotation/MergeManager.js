import { getMergeableLayerFromDataset } from '../utils/neuroglancer';

export default class MergeManager {
  init = (actions, getNeuroglancerColor, backend, neuPrintManager) => {
    this.actions = actions;
    this.getNeuroglancerColor = getNeuroglancerColor;
    this.backend = backend;
    this.neuPrintManager = neuPrintManager;
    this.layerName = 'segmentation';
    if (this.backend) {
      const layer = this.backend.dataset && getMergeableLayerFromDataset(this.backend.dataset);
      this.layerName = layer ? layer.name : this.layerName;
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
      this.actions.setViewerSegmentEquivalences({ layerName: this.layerName, equivalences });

      const segmentColors = this.mergeColors();
      this.actions.setViewerSegmentColors({ layerName: this.layerName, segmentColors });

      this.selection = [main];
      this.actions.setViewerSegments({ layerName: this.layerName, segments: this.selection });

      this.store();

      if (this.onMergeChanged) {
        this.onMergeChanged();
      }
    }
  };

  unmerge = () => {
    this.unmergeSelection(true);

    const equivalences = this.mergeEquivalances();
    this.actions.setViewerSegmentEquivalences({ layerName: this.layerName, equivalences });

    const segmentColors = this.mergeColors();
    this.actions.setViewerSegmentColors({ layerName: this.layerName, segmentColors });

    this.store();

    if (this.onMergeChanged) {
      this.onMergeChanged();
    }
  };

  clear = () => {
    this.unmergeSelection(false);

    this.mainToOthers = {};
    this.otherToMain = {};

    this.actions.setViewerSegmentEquivalences({ layerName: this.layerName, equivalences: [] });
    this.actions.setViewerSegmentColors({ layerName: this.layerName, segmentColors: [] });

    this.store();

    if (this.onMergeChanged) {
      this.onMergeChanged();
    }

    this.mainToTypeMerged = {};
  };

  select = (selectionNow) => {
    this.selection = this.orderedSelection(this.selection, selectionNow);
    if (this.onSelectionChanged) {
      this.onSelectionChanged();
    }
  };

  isolate = (ids) => {
    this.actions.setViewerSegments({ layerName: this.layerName, segments: ids });
  }

  getUltimateMain = (other) => {
    let curr;
    let next = other;
    do {
      curr = next;
      next = this.otherToMain[curr];
    } while (next);
    return curr;
  };

  expand = (ids) => (
    ids.reduce((a, c) => {
      let result = [c];
      const others = this.mainToOthers[c];
      if (others) {
        result = result.concat(this.expand(others));
      }
      return (a.concat(result));
    }, [])
  )

  onSelectionChanged = undefined;

  onMergeChanged = undefined;

  // Internal

  actions = undefined;

  getNeuroglancerColor = undefined;

  backend = undefined;

  mainToOthers = {};

  otherToMain = {};

  selection = [];

  idToType = {};

  mainToTypeMerged = {};

  mergeData = (mainChosen, others) => {
    const main = this.getUltimateMain(mainChosen);
    if (!(main in this.mainToOthers)) {
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

    if (this.neuPrintManager) {
      const idsForTypes = [main].concat(others);
      this.neuPrintManager.getTypes(idsForTypes)
        .then((types) => {
          types.forEach((item) => { this.idToType[item.id] = item.type; });
          this.issueMergeTypeWarnings(idsForTypes);
          this.updateMainToTypeMerged();
        }).catch((err) => {
          this.actions.addAlert({ severity: 'error', message: err.message });
        });
    }
  };

  issueMergeTypeWarnings = (idsForTypes) => {
    const typeToIds = {};
    idsForTypes.forEach((id) => {
      const t = this.idToType[id];
      if (t) {
        const ids = typeToIds[t];
        typeToIds[t] = ids ? ids.concat([id]) : [id];
      }
    });
    if (Object.keys(typeToIds).length > 1) {
      let message = 'Merge will mix types: ';
      const entries = Object.entries(typeToIds);
      message += `'${entries[0][0]}': ${entries[0][1]}; `;
      message += `'${entries[1][0]}': ${entries[1][1]}`;
      if (entries.length > 2) {
        message += '; etc.';
      }
      this.actions.addAlert({ severity: 'warning', message });
    }
  }

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
        // re-merged immediately, if an "undo" is desired.
        selectionNew.push(main);
        others.forEach((other) => { selectionNew.push(other); });
      } else {
        selectionNew.push(selected);
      }
    });

    this.selection = selectionNew;
    this.actions.setViewerSegments({ layerName: this.layerName, segments: this.selection });

    this.updateMainToTypeMerged();
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
    this.backend.restore()
      .then(([mainToOthers, otherToMain]) => {
        this.mainToOthers = mainToOthers;
        this.otherToMain = otherToMain;

        const equivalences = this.mergeEquivalances();
        this.actions.setViewerSegmentEquivalences({ layerName: this.layerName, equivalences });

        const segmentColors = this.mergeColors();
        this.actions.setViewerSegmentColors({ layerName: this.layerName, segmentColors });

        if (this.onMergeChanged) {
          this.onMergeChanged();
        }

        if (this.neuPrintManager) {
          let ids = Object.keys(this.mainToOthers);
          Object.values(this.mainToOthers).forEach((others) => {
            ids = ids.concat(others);
          });
          this.neuPrintManager.getTypes(ids)
            .then((types) => {
              types.forEach((item) => { this.idToType[item.id] = item.type; });
              this.updateMainToTypeMerged();
              // TODO: If any ID from `this.mainToOthers` keys or values is missing from `types`
              // then the official data has changed in conflict with a local merge.
              // So add a warning color and tooltip to the `MergePanel` table.
            }).catch((err) => {
              this.actions.addAlert({ severity: 'error', message: err.message });
            });
        }
      });
  };

  pullRequest = () => (
    this.backend.pullRequest()
  )

  typeMerged = (id) => {
    if (id in this.mainToTypeMerged) {
      return this.mainToTypeMerged[id];
    }
    if (id in this.mainToOthers) {
      const types = [this.idToType[id]];
      this.mainToOthers[id].forEach((other) => {
        types.push(this.typeMerged(other));
      });
      const type = this.combineTypes(types);
      this.mainToTypeMerged[id] = type;
      return type;
    }
    return this.idToType[id];
  }

  combineTypes = (types) => {
    const result = types.reduce((a, c) => {
      if (a && c && (a !== c)) {
        return 'Mixed';
      }
      return a || c;
    }, null);
    return result;
  }

  updateMainToTypeMerged = () => {
    this.mainToTypeMerged = {};
    Object.keys(this.mainToOthers).forEach((main) => {
      this.typeMerged(main);
    });
  }
}
