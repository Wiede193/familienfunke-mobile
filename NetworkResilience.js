// Explicitly scoped to IDEMPOTENT reads. Never wrap INSERT, UPDATE,
// DELETE, authentication, uploads, notifications or Edge Function sends.
const retryableHttpStatuses = new Set([408, 502, 503, 504]);
const transientPattern = /network request failed|failed to fetch|fetch failed|networkerror|network error|connection (?:lost|reset|closed|timed out)|timeout|timed out|econnreset|etimedout|eai_again|enotfound|socket hang up/i;

export function isTransientFailure(value) {
  const err = value?.error || value;
  if (!err) return false;
  const statuses = [value?.status, err?.status, err?.context?.status];
  if (statuses.some(status => retryableHttpStatuses.has(Number(status)))) return true;
  const code = String(err?.code || '').toUpperCase();
  if (['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND'].includes(code)) return true;
  return transientPattern.test(String(err?.message || err || ''));
}

export async function retryRead(operation, {
  isCurrent = () => true,
  delayMs = 350,
  pause = ms => new Promise(resolve => setTimeout(resolve, ms)),
} = {}) {
  // One repeat only, and only after an actual temporary transport/5xx failure.
  // The caller must separately verify freshness before publishing the result.
  try {
    const first = await operation();
    if (!isCurrent() || !isTransientFailure(first)) return first;
    await pause(delayMs);
    if (!isCurrent()) return first;
    return await operation();
  } catch (error) {
    if (!isTransientFailure(error) || !isCurrent()) throw error;
    await pause(delayMs);
    if (!isCurrent()) throw error;
    return await operation();
  }
}

export function createActionGate() {
  let sequence = 0;
  let active = null;
  return {
    acquire() {
      if (active !== null) return null;
      active = ++sequence;
      return active;
    },
    release(ticket) {
      if (active !== ticket) return false;
      active = null;
      return true;
    },
    reset() {
      sequence++;
      active = null;
    },
    isActive(ticket) { return active === ticket; },
  };
}
