export const ssr = false;

/**
 * Client-only page load. We keep this minimal because the page itself fetches data client-side.
 */
export function load() {
  return {};
}
