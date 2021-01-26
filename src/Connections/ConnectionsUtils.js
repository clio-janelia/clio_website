const mergeConnectionRows = (rows, mergeManager) => {
  const mergedMap = {};
  rows.forEach((row) => {
    const mainId = mergeManager.getUltimateMain(row.id);
    const type = mergeManager.mainToTypeMerged[mainId] || row.type;
    const mergedRow = mergedMap[mainId] || { id: mainId, type, weight: 0 };
    mergedRow.weight += row.weight;
    mergedMap[mainId] = mergedRow;
  });
  const mergedRows = Object.values(mergedMap);

  // Sort by weights in descending order.
  mergedRows.sort((a, b) => b.weight - a.weight);
  return mergedRows;
};

export default mergeConnectionRows;
