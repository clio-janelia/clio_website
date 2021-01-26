import MergeManager from './MergeManager';

const mockActions = {
  setViewerSegmentEquivalences: () => {},
  setViewerSegmentColors: () => {},
  setViewerSegments: () => {},
};

const mockGetNeuroglancerColor = () => '#000000';

class MockBackend {
  store = () => {}

  restore = () => new Promise((resolve) => { resolve([{}, {}]); });
}
const mockBackend = new MockBackend();

it('does one-to-one merges and unmerges', () => {
  const mm = new MergeManager();
  mm.init(mockActions, mockGetNeuroglancerColor, mockBackend);

  mm.select([]);
  mm.select([5813024015, 1436987180]);
  mm.merge();

  expect(Object.keys(mm.mainToOthers).length).toEqual(1);
  expect(mm.mainToOthers[5813024015]).toEqual([1436987180]);

  expect(Object.keys(mm.otherToMain).length).toEqual(1);
  expect(mm.otherToMain[1436987180]).toEqual(5813024015);

  mm.select([]);
  mm.select([5813026705, 5813024015]);
  mm.merge();

  expect(Object.keys(mm.mainToOthers).length).toEqual(2);
  expect(mm.mainToOthers[5813024015]).toEqual([1436987180]);
  expect(mm.mainToOthers[5813026705]).toEqual([5813024015]);

  expect(Object.keys(mm.otherToMain).length).toEqual(2);
  expect(mm.otherToMain[1436987180]).toEqual(5813024015);
  expect(mm.otherToMain[5813024015]).toEqual(5813026705);

  mm.select([]);
  mm.select([1100404634, 5813026705]);
  mm.merge();

  expect(Object.keys(mm.mainToOthers).length).toEqual(3);
  expect(mm.mainToOthers[5813024015]).toEqual([1436987180]);
  expect(mm.mainToOthers[5813026705]).toEqual([5813024015]);
  expect(mm.mainToOthers[1100404634]).toEqual([5813026705]);

  expect(Object.keys(mm.otherToMain).length).toEqual(3);
  expect(mm.otherToMain[1436987180]).toEqual(5813024015);
  expect(mm.otherToMain[5813024015]).toEqual(5813026705);
  expect(mm.otherToMain[5813026705]).toEqual(1100404634);

  mm.select([]);
  mm.select([1100404634]);
  mm.unmerge();

  expect(Object.keys(mm.mainToOthers).length).toEqual(2);
  expect(mm.mainToOthers[5813024015]).toEqual([1436987180]);
  expect(mm.mainToOthers[5813026705]).toEqual([5813024015]);

  expect(Object.keys(mm.otherToMain).length).toEqual(2);
  expect(mm.otherToMain[1436987180]).toEqual(5813024015);
  expect(mm.otherToMain[5813024015]).toEqual(5813026705);

  mm.select([]);
  mm.select([5813026705]);
  mm.unmerge();

  expect(Object.keys(mm.mainToOthers).length).toEqual(1);
  expect(mm.mainToOthers[5813024015]).toEqual([1436987180]);

  expect(Object.keys(mm.otherToMain).length).toEqual(1);
  expect(mm.otherToMain[1436987180]).toEqual(5813024015);

  mm.select([]);
  mm.select([5813024015]);
  mm.unmerge();

  expect(Object.keys(mm.mainToOthers).length).toEqual(0);
  expect(Object.keys(mm.otherToMain).length).toEqual(0);
});

it('does many-to-one merges and unmerges', () => {
  const mm = new MergeManager();
  mm.init(mockActions, mockGetNeuroglancerColor, mockBackend);

  mm.select([]);
  mm.select([1404933332, 1135863959, 1501452958]);
  mm.merge();

  expect(Object.keys(mm.mainToOthers).length).toEqual(1);
  expect(mm.mainToOthers[1404933332]).toEqual([1135863959, 1501452958]);

  expect(Object.keys(mm.otherToMain).length).toEqual(2);
  expect(mm.otherToMain[1135863959]).toEqual(1404933332);
  expect(mm.otherToMain[1501452958]).toEqual(1404933332);

  mm.select([1404933332, 1637844473, 5813061024, 1562564719]);
  mm.merge();

  expect(Object.keys(mm.mainToOthers).length).toEqual(1);
  expect(mm.mainToOthers[1404933332])
    .toEqual([1135863959, 1501452958, 1637844473, 5813061024, 1562564719]);

  expect(Object.keys(mm.otherToMain).length).toEqual(5);
  expect(mm.otherToMain[1135863959]).toEqual(1404933332);
  expect(mm.otherToMain[1501452958]).toEqual(1404933332);
  expect(mm.otherToMain[1637844473]).toEqual(1404933332);
  expect(mm.otherToMain[5813061024]).toEqual(1404933332);
  expect(mm.otherToMain[1562564719]).toEqual(1404933332);

  mm.unmerge();
  expect(Object.keys(mm.mainToOthers).length).toEqual(0);
  expect(Object.keys(mm.otherToMain).length).toEqual(0);
});

it('gracefully excludes a self-merge', () => {
  const mm = new MergeManager();
  mm.init(mockActions, mockGetNeuroglancerColor, mockBackend);

  mm.select([]);
  mm.select([5813024015, 5813024015]);
  mm.merge();

  expect(Object.keys(mm.mainToOthers).length).toEqual(0);
  expect(Object.keys(mm.otherToMain).length).toEqual(0);
});

it('handles how Neuroglancer changes the selection', () => {
  const mm = new MergeManager();
  mm.init(mockActions, mockGetNeuroglancerColor, mockBackend);

  mm.select([]);
  mm.select([1100404634]);
  mm.select([1100404634, 983767417]);

  expect(mm.selection).toEqual([1100404634, 983767417]);

  mm.merge();

  expect(Object.keys(mm.mainToOthers).length).toEqual(1);
  expect(mm.mainToOthers[1100404634]).toEqual([983767417]);

  expect(Object.keys(mm.otherToMain).length).toEqual(1);
  expect(mm.otherToMain[983767417]).toEqual(1100404634);

  expect(mm.selection).toEqual([1100404634]);

  // Neuroglancer "equivalances" will represent the merger of B, 983767417, onto A, 1100404634
  // as B, since it is the lower-valued ID.

  mm.select([983767417]);

  // But the MergeManager "normalizes" the selection, to use the IDs of the bodies
  // merged onto.

  expect(mm.selection).toEqual([1100404634]);

  // When a third body C, 5813032600, is selected to be added to A, Neuroglancer will again have
  // an unnormalzed selection (i.e., B and C instead of A and C).

  mm.select([983767417, 5813032600]);

  // And the MergeManager will normalize it.

  expect(mm.selection).toEqual([1100404634, 5813032600]);

  mm.merge();

  expect(Object.keys(mm.mainToOthers).length).toEqual(1);
  expect(mm.mainToOthers[1100404634]).toEqual([983767417, 5813032600]);

  expect(Object.keys(mm.otherToMain).length).toEqual(2);
  expect(mm.otherToMain[983767417]).toEqual(1100404634);
  expect(mm.otherToMain[5813032600]).toEqual(1100404634);

  expect(mm.selection).toEqual([1100404634]);
});

it('expands', () => {
  const mm = new MergeManager();
  mm.init(mockActions, mockGetNeuroglancerColor, mockBackend);

  mm.select([]);
  mm.select([1, 2, 3]);
  mm.merge();

  mm.select([]);
  mm.select([5, 6]);
  mm.merge();

  mm.select([]);
  mm.select([9, 10]);
  mm.merge();

  expect(mm.expand([1, 4, 5, 7, 8, 9])).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

it('expands recursively', () => {
  const mm = new MergeManager();
  mm.init(mockActions, mockGetNeuroglancerColor, mockBackend);

  mm.select([]);
  mm.select([1, 2, 3]);
  mm.merge();

  mm.select([]);
  mm.select([6, 7, 8]);
  mm.merge();

  mm.select([]);
  mm.select([5, 6]);
  mm.merge();

  mm.select([]);
  mm.select([9, 10]);
  mm.merge();

  expect(mm.expand([1, 4, 5, 9])).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

it('combines types', () => {
  const mm = new MergeManager();
  mm.init(mockActions, mockGetNeuroglancerColor, mockBackend);

  expect(mm.combineTypes(['A', 'A', null])).toEqual('A');
  expect(mm.combineTypes(['B', 'C', null])).toEqual('Mixed');
  expect(mm.combineTypes([null, null, 'D'])).toEqual('D');
  expect(mm.combineTypes(['E', 'E', null, 'F'])).toEqual('Mixed');
  expect(mm.combineTypes([null, null, null])).toEqual(null);
});

it('computes merged types', () => {
  const mm = new MergeManager();
  mm.init(mockActions, mockGetNeuroglancerColor, mockBackend);

  mm.idToType = {
    1: 'A', 2: null, 3: 'A', 4: null, 5: 'A', 6: null, 7: 'G', 8: null,
  };

  mm.select([]);
  mm.select([1, 2, 3]);
  mm.merge();

  mm.select([]);
  mm.select([5, 6, 1]);
  mm.merge();

  mm.select([]);
  mm.select([7, 8, 5]);
  mm.merge();

  expect(mm.typeMerged(1)).toEqual('A');
  expect(mm.typeMerged(5)).toEqual('A');
  expect(mm.typeMerged(7)).toEqual('Mixed');

  mm.unmerge();
  expect(mm.mainToTypeMerged[7]).toBeFalsy();
});
