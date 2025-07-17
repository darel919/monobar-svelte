/** @typedef {{ label: string, placeholder: string, displayName: string, url: string }} SearchType */
/** @typedef {{ [key: string]: SearchType }} SearchTypesMap */

/** @type {SearchTypesMap} */
export const SEARCH_TYPES = {
  genre: {
    label: 'Genre',
    placeholder: 'Search for genres',
    displayName: 'Genre',
    url: '/search'
  },
  tag: {
    label: 'Tag',
    placeholder: 'Search for Tag',
    displayName: 'Tag',
    url: '/search'
  },
  request_movies: {
    label: 'Request Movies',
    placeholder: 'Search movie to request',
    displayName: 'Request: Movies',
    url: '/search'
  },
  request_shows: {
    label: 'Request Shows',
    placeholder: 'Search shows to request',
    displayName: 'Request: Series',
    url: '/search'
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

/**
 * Get the search URL for a specific search type
 * @param {string} type
 * @returns {string}
 */
export function getSearchTypeUrl(type) {
  return type in SEARCH_TYPES ? SEARCH_TYPES[type].url : '/search';
}

/**
 * Get search configuration for a specific type
 * @param {string} type
 * @returns {SearchType | null}
 */
export function getSearchTypeConfig(type) {
  return type in SEARCH_TYPES ? SEARCH_TYPES[type] : null;
}

/**
 * Build search URL with proper routing based on search type
 * @param {string} input
 * @param {Record<string, any>} options
 * @returns {string}
 */
export function buildSearchUrlWithType(input, options = {}) {
  const { type } = parseSearchInput(input);
  const baseUrl = type ? getSearchTypeUrl(type) : '/search';
  
  const params = new URLSearchParams();

  if (input.trim()) {
    params.set('q', input.trim());
  }

  Object.entries(options).forEach(([key, value]) => {
    if (value) {
      params.set(key, value.toString());
    }
  });

  return `${baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;
}

/**
 * Check if a search type requires special handling
 * @param {string} type
 * @returns {boolean}
 */
export function isRequestSearchType(type) {
  return type === 'request_movies' || type === 'request_shows';
}

/**
 * Get the left padding value for the search input based on the activePrefix length.
 * Returns a CSS value string (e.g. 'pl-28', 'pl-16', or a custom px value).
 * @param {string | null} activePrefix
 * @param {'default' | 'compact'} [mode='default'] - Use 'compact' for SearchBar, 'default' for main search page
 * @returns {string}
 */
export function getSearchInputPaddingLeft(activePrefix, mode = 'default') {
  if (!activePrefix) return mode === 'compact' ? 'pl-0' : 'pl-4';
  if (mode === 'compact') {
    if (activePrefix.length < 5) return 'pl-12';
    if (activePrefix.length <= 10) return 'pl-16';
    if (activePrefix.length <= 15) return 'pl-28';
    const px = Math.min(180, 48 + activePrefix.length * 6); // max 180px
    return `pl-[${px}px]`;
  } else {
    if (activePrefix.length < 5) return 'pl-24';
    if (activePrefix.length <= 10) return 'pl-28';
    if (activePrefix.length <= 14) return 'pl-44';
    if (activePrefix.length <= 20) return 'pl-56';
    const px = Math.min(320, 80 + activePrefix.length * 8); // max 320px
    return `pl-[${px}px]`;
  }
}
