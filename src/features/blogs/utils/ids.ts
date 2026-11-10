/** Local id for a conversation message; the API only needs it to be a non-empty string. */
export function createClientId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
