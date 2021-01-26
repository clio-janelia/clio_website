/* eslint-disable object-property-newline */
/* eslint-disable no-multi-spaces */

import MergeManager from '../Annotation/MergeManager';
import mergeConnectionRows from './ConnectionsUtils';

const mockActions = {
  setViewerSegmentEquivalences: () => {},
  setViewerSegmentColors: () => {},
  setViewerSegments: () => {},
  addAlert: () => {},
};

const mockGetNeuroglancerColor = () => '#000000';

class MockBackend {
  store = () => {}

  restore = () => new Promise((resolve) => { resolve([{}, {}]); });
}
const mockBackend = new MockBackend();

it('merges ConnectionPanel rows', () => {
  const mm = new MergeManager();
  mm.init(mockActions, mockGetNeuroglancerColor, mockBackend);

  mm.select([]);
  mm.select([11, 12, 13]);
  mm.merge();

  mm.select([]);
  mm.select([21, 22, 23]);
  mm.merge();

  mm.select([]);
  mm.select([31, 32, 33]);
  mm.merge();

  mm.idToType = {
    11: 'A',  12: null, 13: 'A',
    21: null, 22: 'B',  23: 'B',
    31: 'C',  32: 'D',  33: null,
  };

  mm.updateMainToTypeMerged();

  const rows = [
    { id: 11, type: 'A', weight: 11 },
    { id: 12, type: null, weight: 12 },
    { id: 13, type: 'A', weight: 13 },
    { id: 22, type: 'B', weight: 22 },
    { id: 23, type: 'B', weight: 23 },
    { id: 31, type: 'C', weight: 31 },
    { id: 33, type: null, weight: 33 },
  ];

  const rowsMerged = mergeConnectionRows(rows, mm);

  const rowsMergedExpected = [
    { id: 31, type: 'Mixed', weight: 64 },
    { id: 21, type: 'B', weight: 45 },
    { id: 11, type: 'A', weight: 36 },
  ];

  expect(rowsMerged).toStrictEqual(rowsMergedExpected);
});
