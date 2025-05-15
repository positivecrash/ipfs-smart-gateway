# ipfs-smart-gateway

Smart IPFS gateway selector with latency testing and fallback logic (vanilla JS, no dependencies).

## 🚀 Features

- ✅ Sorts gateways by speed (latency)
- 🔁 Fallback strategy for loading content via CID
- 📦 Caches results in localStorage
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
import {
  setDefaultGateways,
  setUserGateways,
  checkGateways,
  getSortedGateways,
  getPickedGateway,
  fetchFromPicked,
  fetchWithFallback
} from 'ipfs-smart-gateway'

setDefaultGateways([
  'https://custom.ipfs.net/ipfs/',
  'https://another.io/ipfs/'
])

await checkGateways({ cid: 'Qm...YourCID...' })
const sorted = getSortedGateways()
const content = await fetchFromPicked('Qm...')
```

---

## 🌐 Usage in HTML (UMD)

```html
<script src="dist/ipfs-smart-gateway.umd.js"></script>
<script>
  IPFSGatewaySelector.checkGateways().then(() => {
    const best = IPFSGatewaySelector.getPickedGateway()
    console.log('Best:', best)
  })
</script>
```

---

## 📄 API

### Configuration

- `setDefaultGateways(array)`
- `setUserGateways(array)`

### Lifecycle

- `checkGateways({ cid, onStart, onSuccess, onFail })`
- `getSortedGateways()`
- `getPickedGateway()` / `setPickedGateway(url)`

### Fetch

- `fetchFromPicked(cid, format)` — default `format = 'text'`
- `fetchWithFallback(cid, format)`

### Storage keys used

- `ipfs-smart-gateway:user-gateways`
- `ipfs-smart-gateway:picked`

---

## 📄 License
MIT
