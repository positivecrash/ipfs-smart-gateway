// ipfs-smart-gateway/index.js

// Default gateway list
let defaultGateways = [
  'https://ipfs.url.today/',
  'https://ipfs.io/',
  'https://flk-ipfs.xyz/',
  'https://ipfs.cyou/',
  'https://storry.tv/',
  'https://dweb.link/',
  'https://gateway.pinata.cloud/',
  'https://hardbin.com/',
  'https://ipfs.runfission.com/',
  'https://ipfs.eth.aragon.network/',
  'https://nftstorage.link/',
  'https://4everland.io/',
  'https://w3s.link/',
  'https://trustless-gateway.link/'
];

// User gateways & results
let userGateways = [];
let gatewayResults = [];
let sortedGateways = [];
let pickedGateway = null;

// Storage & limits
const STORAGE_PREFIX = 'ipfs-smart-gateway:';
const MAX_USER_GATEWAYS = 15;

// Global configuration options
const settings = {
  stopOnFirstSuccess: false,
  persistStorage: true,
  timeout: 3000
};

// Configure runtime behavior
function configure(options = {}) {
  Object.assign(settings, options);
}

// Normalize a gateway URL (ensure https://)
function normalizeGatewayUrl(raw) {
  let url = raw.trim();

  // Add protocol "https://" if there is no «scheme://» 
  if (!/^[a-z][a-z\d+\-.]*:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  // Remove "/ipfs" or "/ipfs/"
  url = url.replace(/\/ipfs\/?$/, '');

  // Ensure trailing slash
  url = url.replace(/\/+$/, '');

  return url;
}


// Default gateways API
function setDefaultGateways(urls) {
  if (Array.isArray(urls)) {
    defaultGateways = urls
      .filter(Boolean)
      .map(normalizeGatewayUrl);
  }
}

function getDefaultGateways() {
  return defaultGateways.slice();
}

// User gateways API
function setUserGateways(urls) {
  
  if (!Array.isArray(urls)) return;
  
  // 1) Normalize incoming URLs
  const normalized = urls
    .map(normalizeGatewayUrl)
    .filter(Boolean);
    
  // 2) Remove existing in default list
  const defaults = defaultGateways.map(normalizeGatewayUrl);
  const filtered = normalized.filter(u => !defaults.includes(u));

  // 3) Merge with existing in localStorage (or session memory)
  const existing = getUserGateways();
  const combined = Array.from(new Set([...existing, ...filtered]));

  // 4) Check size
  if (combined.length > MAX_USER_GATEWAYS) {
    throw new Error(`Maximum of ${MAX_USER_GATEWAYS} user gateways exceeded`);
  }

  // 5) Save
  userGateways = combined;
  if (settings.persistStorage) {
    localStorage.setItem(
      `${STORAGE_PREFIX}user-gateways`,
      JSON.stringify(userGateways)
    );
  }
}


function removeUserGateways(urls) {
  if (!Array.isArray(urls)) return;
  const toRemove = urls.map(normalizeGatewayUrl);
  const updated = getUserGateways().filter(u => !toRemove.includes(u));
  // Replace with updated list
  userGateways = updated;
  if (settings.persistStorage) {
    localStorage.setItem(
      `${STORAGE_PREFIX}user-gateways`,
      JSON.stringify(userGateways)
    );
  }
}

function getUserGateways() {
  if (!settings.persistStorage) {
    return userGateways.slice();
  }
  try {
    const cached = JSON.parse(
      localStorage.getItem(`${STORAGE_PREFIX}user-gateways`)
    );
    return Array.isArray(cached)
      ? cached.map(normalizeGatewayUrl)
      : [];
  } catch {
    return [];
  }
}

function loadUserGatewaysFromCache() {
  userGateways = getUserGateways();
}

// Combine default + user
function getAllGateways() {
  return [...getDefaultGateways(), ...getUserGateways()];
}

// Picked / sorted getters
function getSortedGateways() {
  return sortedGateways.slice();
}

function getPickedGateway() {
  return pickedGateway;
}

function setPickedGateway(url) {
  pickedGateway = normalizeGatewayUrl(url);
  if (settings.persistStorage) {
    localStorage.setItem(
      `${STORAGE_PREFIX}picked`,
      pickedGateway
    );
  }
}

function loadPickedGatewayFromCache() {
  const cached = localStorage.getItem(`${STORAGE_PREFIX}picked`);
  if (cached) {
    pickedGateway = normalizeGatewayUrl(cached);
  }
}

// Measure single gateway
async function measureGateway(url, cid, timeout = settings.timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const start = performance.now();
  try {
    const res = await fetch(`${url}/ipfs/${cid}`, {
      method: 'GET',
      headers: { 'Range': 'bytes=0-0' },
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return performance.now() - start;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

async function checkGateways(options = {}) {
  const {
    cid = 'bafybeibwzifw52ttrkqlikfzext5akxu7lz4xiwjgwzmqcpdzmp3n5vnbe',
    retry = 0,
    retryDelay = 1000,
    onStart,
    onSuccess,
    onFail
  } = options;

  loadUserGatewaysFromCache();
  loadPickedGatewayFromCache();

  if (onStart) onStart();

  const urls = getAllGateways();
  let results = [];

  for (let attempt = 0; attempt <= retry; attempt++) {
    results = [];

    await Promise.all(
      urls.map(async (url) => {
        let status = 'unreachable', time = null;
        try {
          const t = await measureGateway(url, cid);
          if (t !== null) {
            status = 'available';
            time = t;
          }
        } catch {}
        const result = { url, status, time };
        results.push(result);

        if (status === 'available' && onSuccess) onSuccess(result);
        if (status !== 'available' && onFail) onFail(result);
      })
    );

    const available = results.filter(r => r.time !== null);

    if (available.length > 0 || attempt === retry) {
      gatewayResults = results;
      sortedGateways = available.sort((a, b) => a.time - b.time);

      if (sortedGateways.length) {
        setPickedGateway(sortedGateways[0].url);
      }

      return sortedGateways;
    }

    // Подождать перед следующей попыткой
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }

  // fallback (если ни одна попытка не сработала, но до конца не дошли)
  gatewayResults = results;
  sortedGateways = [];
  return [];
}


// Fetch helpers
async function fetchAndParse(res, format) {
  switch (format) {
    case 'json': return await res.json();
    case 'blob': return await res.blob();
    default: return await res.text();
  }
}

async function fetchWithFallback(cid, format = 'text') {
  const candidates = sortedGateways.map(g => g.url);
  const fallbacks = getAllGateways().filter(u => !candidates.includes(u));
  const all = [...candidates, ...fallbacks.sort(() => Math.random() - 0.5)];
  for (const url of all) {
    try {
      const res = await fetch(`${url}/ipfs/${cid}`);
      if (res.ok) return await fetchAndParse(res, format);
    } catch {}
  }
  return null;
}

async function fetchFromPicked(cid, format = 'text') {
  if (!pickedGateway) return null;
  try {
    const res = await fetch(`${pickedGateway}/ipfs/${cid}`);
    if (res.ok) return await fetchAndParse(res, format);
  } catch {}
  return null;
}

// Export public API
export {
  configure,
  setDefaultGateways,
  getDefaultGateways,
  setUserGateways,
  getUserGateways,
  removeUserGateways,
  loadUserGatewaysFromCache,
  getAllGateways,
  checkGateways,
  getSortedGateways,
  getPickedGateway,
  setPickedGateway,
  loadPickedGatewayFromCache,
  fetchWithFallback,
  fetchFromPicked,
  measureGateway,
  normalizeGatewayUrl
};
