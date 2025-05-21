# ipfs-smart-gateway

Smart selector and latency tester for IPFS HTTP gateways (vanilla JS, no dependencies).

Checks gateway availability and performance by fetching only the first byte of a CID (using HTTP Range requests) and aborting stalled requests early—making latency testing extremely fast and bandwidth-efficient.

Sorts gateways by latency, supports fallback and custom lists, works in any browser or framework.

[Live Demo](https://positivecrash.github.io/ipfs-smart-gateway/)

---

## 🚀 Features

- Sorts public and custom IPFS gateways by latency
- Automatically picks the best/fastest gateway for a given CID
- Fallback strategy: tries all, picks fastest, randomizes if needed
- User can add and remove their own gateways (persisted in localStorage)
- All gateway lists can be configured at runtime
- Works in plain HTML, Vue, React, Svelte, or any JS app
- No external dependencies

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

## 🧑‍💻 Usage (ESM)

```js
import * as ipfsGateway from 'ipfs-smart-gateway';

ipfsGateway.configure({
  stopOnFirstSuccess: true,
  persistStorage: true,
  timeout: 5000
});

// Overwrite default gateway list
ipfsGateway.setDefaultGateways([
  'https://custom.ipfs.net/ipfs/',
  'https://another.io/ipfs/'
]);

// Add user gateways
ipfsGateway.setUserGateways([
  'https://my-gw.example.com/ipfs/'
]);

// Remove user gateways
ipfsGateway.removeUserGateways([
  'https://my-gw.example.com/ipfs/'
]);

// Run latency checks
await ipfsGateway.checkGateways({
  cid: 'Qm...YourCID...',
  onStart: () => console.log('Starting checks...'),
  onSuccess: g => console.log('✅', g.url, g.time, 'ms'),
  onFail: g => console.log('❌', g.url)
});

// Inspect results
const sorted = ipfsGateway.getSortedGateways();
const picked = ipfsGateway.getPickedGateway();
console.log('Fastest gateway:', picked);

// Fetch content
const text = await ipfsGateway.fetchFromPicked('Qm...YourCID...');
const json = await ipfsGateway.fetchFromPicked('Qm...JsonCID', 'json');
```

---

## 🌐 Usage in HTML (UMD)

```html
<script src="https://unpkg.com/ipfs-smart-gateway/dist/ipfs-smart-gateway.umd.js"></script>
<script>
  const cid = 'QmYourCID';
  ipfsSmartGateway.checkGateways({ cid })
    .then(() => {
      const best = ipfsSmartGateway.getPickedGateway();
      console.log('Best gateway:', best);
      return ipfsSmartGateway.fetchFromPicked(cid);
    })
    .then(content => console.log('Content:', content));
</script>
```

---

## ⚙️ Configuration

```js
ipfsGateway.configure({
  stopOnFirstSuccess: true, // Stop on first working gateway (faster, less traffic)
  persistStorage: false,    // Don't save anything in localStorage (session only)
  timeout: 5000             // Timeout in ms per gateway probe (default: 3000)
});
```

---

## 📄 API

### Gateway Management

- **setDefaultGateways(array)**
  Overwrite the built-in default gateway list.

- **getDefaultGateways()**
  Retrieve the current default gateways.

- **setUserGateways(array)**
  Persist a list of user-defined gateways (max 15).

- **getUserGateways()**
  Retrieve the current list of user gateways.

- **removeUserGateways(array)**
  Remove specified gateways from the user list.

- **getAllGateways()**
  Returns combined default + user gateways.

### Gateway Status and Selection

- **checkGateways({ cid, onStart, onSuccess, onFail })**
  Perform parallel latency and availability checks for the given CID.  
  **Parameters:**
  - `cid` (string): IPFS CID to test.
  - `onStart` (function): callback before any checks.
  - `onSuccess` (function): callback for each successful gateway.
  - `onFail` (function): callback for each failed gateway.

- **getSortedGateways()**
  Returns gateways sorted by measured latency (fastest first).

- **getPickedGateway()**
  Returns the fastest gateway URL, or `null` if none.

- **setPickedGateway(url)**
  Manually set the picked gateway.

- **loadUserGatewaysFromCache()**
  Load user gateways from localStorage.

- **loadPickedGatewayFromCache()**
  Load the last picked gateway from localStorage.

### Fetching Content

- **fetchFromPicked(cid, format = 'text')**
  Fetches from the currently picked gateway.  
  `format` may be `'text'`, `'json'`, or `'blob'`.

- **fetchWithFallback(cid, format = 'text')**
  Attempts fetch in order of latency, then random fallback gateways.

---

## 📋 Examples

**Basic: Check and pick fastest gateway**
```js
await ipfsSmartGateway.checkGateways({ cid: 'QmYourCID' });
const sorted = ipfsSmartGateway.getSortedGateways();
console.log('Sorted by latency:', sorted);
const picked = ipfsSmartGateway.getPickedGateway();
const text = await ipfsSmartGateway.fetchFromPicked('QmYourCID');
```

**Add user gateway and test**
```js
ipfsSmartGateway.setUserGateways(['https://my-gw.example.com/ipfs/']);
await ipfsSmartGateway.checkGateways({ cid: 'QmYourCID' });
```

**Remove user gateways:**
```js
ipfsSmartGateway.removeUserGateways([
  'https://my-gw.example-1.com/ipfs/',
  'https://my-gw.example-2.com/ipfs/'
]);
```

**Fetch as JSON or Blob**
```js
const data = await ipfsSmartGateway.fetchFromPicked('QmYourJson', 'json');
const blob = await ipfsSmartGateway.fetchFromPicked('QmFile', 'blob');
```

**Listen to gateway check events**
```js
await ipfsSmartGateway.checkGateways({
  cid: 'QmTest',
  onStart: () => console.log('Started...'),
  onSuccess: g => console.log('✅', g.url, g.time),
  onFail: g => console.log('❌', g.url)
});
```

---

## 🔒 Storage Keys Used

If storage is enabled, the following keys are used in `localStorage`:

- `ipfs-smart-gateway:user-gateways`
- `ipfs-smart-gateway:picked`

---

## 📝 License

MIT

---

> **Note:** Some of this documentation and initial scaffolding was generated in collaboration with AI (OpenAI’s ChatGPT).