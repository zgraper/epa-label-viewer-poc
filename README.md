# EPA Label Viewer — Proof of Concept

A standalone full-stack proof of concept that lets a user search EPA-registered pesticide products and view their label PDFs, including full label version history.

> **This is a standalone POC.**  It is intentionally kept minimal — no database, no auth, no deployment config.  The goal is to validate the EPA API and demonstrate the core UX before wiring it into a larger application.

---

## Features

- Search pesticide products by **product name**, **active ingredient**, or **EPA reg. number**
- View full product details: company name, registration status, active ingredients
- Browse **all historical label PDFs** for a product via a version selector
- Defaults to the newest label; older versions are accessible from a dropdown
- Labels render inline via the browser's built-in PDF viewer

---

## Tech Stack

| Layer    | Tech                      |
|----------|---------------------------|
| Frontend | React 19 + Vite           |
| Backend  | Node.js + Express         |
| Data     | EPA PPLS ORDS API (JSON)  |

No scraping.  All product and label data is fetched from the [EPA PPLS documented REST API](https://www.epa.gov/pesticide-labels/pesticide-product-label-system-ppls-application-program-interface-api).

---

## Folder Structure

```
epa-label-viewer-poc/
├── backend/
│   └── src/
│       ├── index.js                  # Express app entry point
│       ├── routes/
│       │   └── pesticides.js         # /api/pesticides/* route handlers
│       ├── services/
│       │   ├── epaService.js         # Public search + product API
│       │   ├── epaHttpClient.js      # Fetch wrapper + ORDS response helpers
│       │   └── epaNormalizer.js      # Pure data normalization (no HTTP)
│       └── utils/
│           └── validation.js         # Shared request validation helpers
├── frontend/
│   └── src/
│       ├── api/
│       │   └── epaApi.js             # Fetch wrappers for the backend API
│       ├── components/
│       │   ├── SearchPanel.jsx       # Search input, mode select, submit button
│       │   ├── ResultsList.jsx       # Scrollable search results list
│       │   └── PdfViewer.jsx         # PDF iframe + label version selector
│       ├── hooks/
│       │   └── useProductSelection.js  # Product fetch + selection state
│       ├── App.jsx                   # App shell / top-level state
│       └── main.jsx
└── README.md
```

---

## Local Setup

### Prerequisites

- Node.js ≥ 18

### 1. Start the backend

```bash
cd backend
npm install
npm run dev      # starts on http://localhost:3001 with hot-reload (nodemon)
# or
npm start        # starts without hot-reload
```

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev      # starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.  The Vite dev server proxies all `/api/*` requests to the backend automatically — no CORS config needed during development.

---

## API Endpoints

| Method | Path                                  | Description                               |
|--------|---------------------------------------|-------------------------------------------|
| GET    | `/api/health`                         | Health check                              |
| GET    | `/api/pesticides/search?q=&mode=`     | Search products by keyword                |
| GET    | `/api/pesticides/product/:regNo`      | Fetch product details + full label history |

### Query parameters for `/search`

| Param  | Required | Values                          | Default   |
|--------|----------|---------------------------------|-----------|
| `q`    | yes      | Any search term                 | —         |
| `mode` | no       | `product`, `ingredient`, `regno`| `product` |

### Example requests

```bash
# Search by product name
curl "http://localhost:3001/api/pesticides/search?q=roundup&mode=product"

# Search by active ingredient
curl "http://localhost:3001/api/pesticides/search?q=glyphosate&mode=ingredient"

# Search by EPA registration number (partial match)
curl "http://localhost:3001/api/pesticides/search?q=524-475&mode=regno"

# Get full product detail + label history
curl "http://localhost:3001/api/pesticides/product/524-475"
```

### Example product response

```json
{
  "epaRegNo": "524-475",
  "productName": "ROUNDUP WEED & GRASS KILLER CONCENTRATE PLUS",
  "companyName": "MONSANTO COMPANY",
  "productStatus": "Registered",
  "activeIngredients": ["GLYPHOSATE"],
  "pdfFiles": [
    {
      "acceptedDate": "2022-08-15",
      "pdfUrl": "https://www.epa.gov/pesticide-labels/...",
      "sourceName": "..."
    },
    {
      "acceptedDate": "2019-03-01",
      "pdfUrl": "https://www.epa.gov/pesticide-labels/...",
      "sourceName": "..."
    }
  ]
}
```

`pdfFiles` is sorted newest-first.  The frontend defaults to `pdfFiles[0]` and shows a version selector when multiple labels exist.

---

## Current Limitations

- **No caching** — every request hits the EPA API directly; repeated lookups are slow
- **No auth** — the backend is open to any client; not suitable for public deployment as-is
- **No pagination** — search results are capped by whatever the EPA API returns (typically ≤ 50 items)
- **PDF rendering** — relies on the browser's built-in PDF viewer; behavior varies by browser and OS
- **Date formatting** — accepted dates are displayed as returned by the EPA API; some products have inconsistent date strings
- **Ingredient search** — uses a separate EPA endpoint that returns slightly different fields; results may look inconsistent with product-name results

---

## Ideas for Future Integration (e.g. Cornbelt AI)

The code is structured so individual pieces can be extracted into a larger application:

| Piece | Where | Notes |
|---|---|---|
| EPA HTTP + normalization | `backend/src/services/epaHttpClient.js`, `epaNormalizer.js` | Pure functions; drop into any Node backend |
| Product search + detail routes | `backend/src/routes/pesticides.js` | Mount at any Express path |
| Validation helpers | `backend/src/utils/validation.js` | Reusable across routes |
| Frontend API wrapper | `frontend/src/api/epaApi.js` | Update `BASE` to point at the host app's backend |
| Product selection hook | `frontend/src/hooks/useProductSelection.js` | Copy hook + `epaApi.js` |
| UI components | `frontend/src/components/` | Each component has minimal external dependencies |

Suggested integration steps:

1. Copy `backend/src/services/` and `backend/src/utils/` into the host backend
2. Mount `backend/src/routes/pesticides.js` under `/api/pesticides` (or any prefix)
3. Copy `frontend/src/api/epaApi.js` and update `BASE` to the new endpoint path
4. Copy `frontend/src/hooks/useProductSelection.js`
5. Import `SearchPanel`, `ResultsList`, and `PdfViewer` into the host app's layout
6. Add a caching layer (e.g. Redis or in-memory TTL cache) in front of the EPA API calls to reduce latency and rate-limit exposure

