# ipfs-smart-gateway

Smart IPFS gateway selector with latency testing and fallback logic (vanilla JS, no dependencies).

## 🚀 Features

- ✅ Sorts gateways by speed (latency)
- 🔁 Fallback strategy for loading content via CID
- 🧠 Configurable behavior: auto-persist, early stop, custom timeout
- 📦 LocalStorage caching (optional)
- ⚙️ Use in any app (Vue, React, or plain HTML)

---

## 📦 Installation

```bash
npm install ipfs-smart-gateway
```

Or use via CDN:

```html
<script src="https://unpkg.com/ipfs-smart-gateway/dist/ipfs-smart-gateway.umd.js"></script>
```

---

## 🧠 Usage (ESM or Vue)

```js
import * as ipfsGateway from 'ipfs-smart-gateway'

ipfsGateway.configure({
  stopOnFirstSuccess: true,
  persistStorage: true,
  timeout: 5000
})

ipfsGateway.setDefaultGateways([
  'https://custom.ipfs.net/ipfs/',
  'https://another.io/ipfs/'
])

await ipfsGateway.checkGateways({ cid: 'Qm...YourCID...' })
const sorted = ipfsGateway.getSortedGateways()
const content = await ipfsGateway.fetchFromPicked('Qm...')
```

---

## 🌐 Usage in HTML (UMD)

```html
<script src="dist/ipfs-smart-gateway.umd.js"></script>
<script>
  ipfsSmartGateway.configure({ timeout: 3000 })
  ipfsSmartGateway.checkGateways().then(() => {
    const best = ipfsSmartGateway.getPickedGateway()
    console.log('Best:', best)
  })
</script>
```

---

## ⚙️ Configuration

You can control the behavior of the package via `configure()`:

```js
ipfsGateway.configure({
  stopOnFirstSuccess: true,    // stop checking once one success is found
  persistStorage: false,       // disable localStorage use
  timeout: 5000                // timeout in ms per request
})
```

---

## 📄 API

### Configuration
- `configure({ stopOnFirstSuccess, persistStorage, timeout })`
- `setDefaultGateways(array)`
- `setUserGateways(array)`
- `getUserGateways()`

### Lifecycle
- `checkGateways({ cid, onStart, onSuccess, onFail })`
- `getSortedGateways()`
- `getPickedGateway()` / `setPickedGateway(url)`

### Fetch
- `fetchFromPicked(cid, format)` — default `format = 'text'`
- `fetchWithFallback(cid, format)`

### Storage keys used (if enabled)
- `ipfs-smart-gateway:user-gateways`
- `ipfs-smart-gateway:picked`

---

## 📄 License
MIT