/* eslint-disable-next-line  import/prefer-default-export */
export function canWrite(roles, dataset) {
  // Check global roles
  if (roles.global_roles && roles.global_roles.includes('clio_write')) {
    return true;
  }
  // Check dataset roles
  if (Object.keys(roles.datasets).includes(dataset) && roles.datasets[dataset].includes('clio_write')) {
    return true;
  }
  return false;
}
