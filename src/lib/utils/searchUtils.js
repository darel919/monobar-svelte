/** @typedef {{ label: string, placeholder: string, displayName: string }} SearchType */
/** @typedef {{ [key: string]: SearchType }} SearchTypesMap */

/** @type {SearchTypesMap} */
export const SEARCH_TYPES = {
  genre: {
    label: 'Genre',
    placeholder: 'Search for genres',
    displayName: 'Genre'
  },
  tag: {
    label: 'Tag',
    placeholder: 'Search for Tag',
    displayName: 'Tag'
  }
};

/**
 * @param {string} input
 * @returns {{ type: string | null, query: string, hasPrefix: boolean }}
 */
export function parseSearchInput(input) {
    if (!input || typeof input !== 'string') {
        return { type: null, query: '', hasPrefix: false };
    }

    const trimmedInput = input.trim();
    const prefixMatch = trimmedInput.match(/^(\w+):(.*)$/);
    
    if (prefixMatch) {
        const [, potentialType, query] = prefixMatch;
        const normalizedType = potentialType.toLowerCase();

        if (normalizedType in SEARCH_TYPES) {
            return {
                type: normalizedType,
                query: query.trim(),
                hasPrefix: true
            };
        }
    }
    
    return { type: null, query: trimmedInput, hasPrefix: false };
}

/**
 * @param {string} input
 * @returns {string}
 */
export function getSearchPlaceholder(input) {
  const { type, hasPrefix } = parseSearchInput(input);
  
  if (hasPrefix && type && type in SEARCH_TYPES) {
    return SEARCH_TYPES[type].placeholder;
  }
  
  return 'Search';
}

/**
 * @param {string} type
 * @returns {string}
 */
export function getSearchTypeDisplayName(type) {
  return type in SEARCH_TYPES ? SEARCH_TYPES[type].displayName : '';
}

/**
 * Constructs a full search query from type and query parts
 * @param {string | null} type
 * @param {string} query
 * @returns {string}
 */
export function buildFullQuery(type, query) {
  if (type && query.trim()) {
    return `${type}:${query.trim()}`;
  }
  return query.trim();
}

/**
 * @param {string} input
 * @param {Record<string, any>} options
 * @returns {string}
 */
export function buildSearchUrl(input, options = {}) {
  const params = new URLSearchParams();

  if (input.trim()) {
    params.set('q', input.trim());
  }

  Object.entries(options).forEach(([key, value]) => {
    if (value) {
      params.set(key, value.toString());
    }
  });

  return `/search${params.toString() ? `?${params.toString()}` : ''}`;
}
