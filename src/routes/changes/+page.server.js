import { getChangelog } from '$lib/server/api.js';

export async function load({ fetch }) {
  const { data: changes, error } = await getChangelog(fetch);
  return { changes: changes || [], error };
}
