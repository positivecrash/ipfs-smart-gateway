// ipfs-smart-gateway/index.js

// Default gateway list
let defaultGateways = [
    'https://ipfs.url.today/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://aira.mypinata.cloud/ipfs/'
  ];
  
  let userGateways = [];
  let gatewayResults = [];
  let sortedGateways = [];
  let pickedGateway = null;
  
  const STORAGE_PREFIX = 'ipfs-smart-gateway:';
  const MAX_USER_GATEWAYS = 15;
  
  // Global configuration options
  const settings = {
    stopOnFirstSuccess: false,
    persistStorage: true,
    timeout: 3000
  };
  
  function configure(options = {}) {
    Object.assign(settings, options);
  }
  
  function normalizeGatewayUrl(url) {
    if (!/^https?:\/\//.test(url)) {
      url = 'https://' + url;
    }
    return url;
  }
  
  function setDefaultGateways(urls) {
    if (Array.isArray(urls)) {
      defaultGateways = urls.filter(Boolean).map(normalizeGatewayUrl);
    }
  }
  
  function setUserGateways(urls) {
    const existing = getUserGateways();
    const toAdd = urls.map(normalizeGatewayUrl).filter(Boolean);
    const combined = Array.from(new Set([...existing, ...toAdd]));
  
    if (combined.length > MAX_USER_GATEWAYS) {
      throw new Error(`Maximum of ${MAX_USER_GATEWAYS} user gateways exceeded`);
    }
  
    userGateways = combined;
  
    if (settings.persistStorage) {
      localStorage.setItem(`${STORAGE_PREFIX}user-gateways`, JSON.stringify(userGateways));
    }
  }
  
  function getUserGateways() {
    try {
      const cached = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}user-gateways`));
      return Array.isArray(cached) ? cached.map(normalizeGatewayUrl) : [];
    } catch (_) {
      return [];
    }
  }
  
  function loadUserGatewaysFromCache() {
    userGateways = getUserGateways();
  }
  
  function getAllGateways() {
    return [...defaultGateways, ...userGateways];
  }
  
  function getSortedGateways() {
    return sortedGateways.slice();
  }
  
  function getPickedGateway() {
    return pickedGateway;
  }
  
  function setPickedGateway(url) {
    pickedGateway = normalizeGatewayUrl(url);
    if (settings.persistStorage) {
      localStorage.setItem(`${STORAGE_PREFIX}picked`, pickedGateway);
    }
  }
  
  function loadPickedGatewayFromCache() {
    const cached = localStorage.getItem(`${STORAGE_PREFIX}picked`);
    if (cached) pickedGateway = normalizeGatewayUrl(cached);
  }
  
  // Measures response time from gateway
  async function measureGateway(url, cid, timeout = settings.timeout) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const start = performance.now();
  
    try {
      const res = await fetch(`${url}${cid}`, {
        method: 'GET',
        headers: { 'Range': 'bytes=0-0' },
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      return performance.now() - start;
    } catch (_) {
      clearTimeout(timer);
      return null;
    }
  }
  
  // Runs gateway speed and availability check
  async function checkGateways(options = {}) {
    const {
      cid = 'bafybeibwzifw52ttrkqlikfzext5akxu7lz4xiwjgwzmqcpdzmp3n5vnbe',
      onStart,
      onSuccess,
      onFail
    } = options;
  
    loadUserGatewaysFromCache();
    loadPickedGatewayFromCache();
  
    if (onStart) onStart();
  
    const urls = getAllGateways();
    const results = [];
  
    for (const url of urls) {
      const time = await measureGateway(url, cid);
      const result = {
        url,
        time,
        status: time !== null ? 'available' : 'unreachable'
      };
      results.push(result);
  
      if (time !== null && onSuccess) onSuccess(result);
      if (time === null && onFail) onFail(result);
  
      if (settings.stopOnFirstSuccess && time !== null) {
        break;
      }
    }
  
    gatewayResults = results;
    sortedGateways = gatewayResults.filter(r => r.time !== null).sort((a, b) => a.time - b.time);
  
    if (sortedGateways.length > 0) {
      setPickedGateway(sortedGateways[0].url);
    }
  }
  
  // Tries all sorted gateways then random fallback
  async function fetchWithFallback(cid, format = 'text') {
    const candidates = sortedGateways.map(g => g.url);
    const fallbacks = getAllGateways().filter(url => !candidates.includes(url));
    const randomFallbacks = fallbacks.sort(() => Math.random() - 0.5);
    const all = [...candidates, ...randomFallbacks];
  
    for (const url of all) {
      try {
        const res = await fetch(`${url}${cid}`);
        if (res.ok) return await parseResponse(res, format);
      } catch (_) {}
    }
    return null;
  }
  
  // Attempts to fetch from best (picked) gateway
  async function fetchFromPicked(cid, format = 'text') {
    if (!pickedGateway) return null;
    try {
      const res = await fetch(`${pickedGateway}${cid}`);
      if (res.ok) return await parseResponse(res, format);
    } catch (_) {}
    return null;
  }
  
  // Parses response based on format
  async function parseResponse(res, format) {
    switch (format) {
      case 'json': return await res.json();
      case 'blob': return await res.blob();
      case 'text':
      default: return await res.text();
    }
  }
  
  export {
    configure,
    checkGateways,
    fetchWithFallback,
    fetchFromPicked,
    getSortedGateways,
    setPickedGateway,
    getPickedGateway,
    setUserGateways,
    getUserGateways,
    loadUserGatewaysFromCache,
    loadPickedGatewayFromCache,
    setDefaultGateways
  };
  