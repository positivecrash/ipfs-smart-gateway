// ipfs-smart-gateway/index.js

/**
 * Smart IPFS Gateway Utility (Vanilla JS)
 * - Measures latency of gateways
 * - Builds sorted list of available gateways
 * - Supports fallback loading via CID
 * - Supports localStorage caching
 * - Emits optional lifecycle callbacks (onStart, onSuccess, onFail)
 * - No dependencies
 */

let defaultGateways = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/'
  ]
  
  let userGateways = []
  let gatewayResults = []
  let sortedGateways = []
  let pickedGateway = null
  
  const STORAGE_PREFIX = 'ipfs-smart-gateway:'
  
  function setDefaultGateways(urls) {
    if (Array.isArray(urls)) {
      defaultGateways = urls.filter(Boolean)
    }
  }
  
  function setUserGateways(urls) {
    userGateways = urls.filter(Boolean)
    localStorage.setItem(`${STORAGE_PREFIX}user-gateways`, JSON.stringify(userGateways))
  }
  
  function loadUserGatewaysFromCache() {
    try {
      const cached = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}user-gateways`))
      if (Array.isArray(cached)) {
        userGateways = cached
      }
    } catch (_) {}
  }
  
  function getAllGateways() {
    return [...defaultGateways, ...userGateways]
  }
  
  function getSortedGateways() {
    return sortedGateways.slice()
  }
  
  function getPickedGateway() {
    return pickedGateway
  }
  
  function setPickedGateway(url) {
    pickedGateway = url
    localStorage.setItem(`${STORAGE_PREFIX}picked`, url)
  }
  
  function loadPickedGatewayFromCache() {
    const cached = localStorage.getItem(`${STORAGE_PREFIX}picked`)
    if (cached) pickedGateway = cached
  }
  
  async function measureGateway(url, cid, timeout = 3000) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    const start = performance.now()
    try {
      const res = await fetch(`${url}${cid}`, { method: 'HEAD', signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) return null
      return performance.now() - start
    } catch (_) {
      clearTimeout(timer)
      return null
    }
  }
  
  async function checkGateways(options = {}) {
    const { cid = 'QmYwAPJzv5CZsnAzt8auVTLW8e1JGrPjvVGWADdXpzZQuA', onStart, onSuccess, onFail } = options
  
    loadUserGatewaysFromCache()
    loadPickedGatewayFromCache()
  
    if (onStart) onStart()
  
    const urls = getAllGateways()
    const results = await Promise.all(urls.map(async url => {
      const time = await measureGateway(url, cid)
      const result = {
        url,
        time,
        status: time !== null ? 'available' : 'unreachable'
      }
      if (time !== null && onSuccess) onSuccess(result)
      if (time === null && onFail) onFail(result)
      return result
    }))
  
    gatewayResults = results
    sortedGateways = results.filter(r => r.time !== null).sort((a, b) => a.time - b.time)
    if (!pickedGateway) pickedGateway = sortedGateways[0]?.url || null
  }
  
  async function fetchWithFallback(cid, format = 'text') {
    const candidates = sortedGateways.map(g => g.url)
    const fallbacks = getAllGateways().filter(url => !candidates.includes(url))
    const randomFallbacks = fallbacks.sort(() => Math.random() - 0.5)
    const all = [...candidates, ...randomFallbacks]
  
    for (const url of all) {
      try {
        const res = await fetch(`${url}${cid}`)
        if (res.ok) return await parseResponse(res, format)
      } catch (_) {}
    }
    return null
  }
  
  async function fetchFromPicked(cid, format = 'text') {
    if (!pickedGateway) return null
    try {
      const res = await fetch(`${pickedGateway}${cid}`)
      if (res.ok) return await parseResponse(res, format)
    } catch (_) {}
    return null
  }
  
  async function parseResponse(res, format) {
    switch (format) {
      case 'json': return await res.json()
      case 'blob': return await res.blob()
      case 'text':
      default: return await res.text()
    }
  }
  
  export {
    checkGateways,
    fetchWithFallback,
    fetchFromPicked,
    getSortedGateways,
    setPickedGateway,
    getPickedGateway,
    setUserGateways,
    loadUserGatewaysFromCache,
    loadPickedGatewayFromCache,
    setDefaultGateways
  }
  