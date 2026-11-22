// Ignore outdated account-bound HTTP results. Both the active account AND
// the request generation must still match before publishing data to the UI.
export function isCurrentRequest(activeAccount,requestAccount,activeGeneration,requestGeneration){
  return !!requestAccount && activeAccount===requestAccount &&
    Number.isInteger(activeGeneration) && activeGeneration===requestGeneration;
}
