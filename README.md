# EPA Label Viewer — Proof of Concept

A small full-stack app that lets a user search EPA-registered pesticide products and view their label PDFs.

## Tech Stack

| Layer    | Tech              |
|----------|-------------------|
| Frontend | React 19 + Vite   |
| Backend  | Node.js + Express |
| Data     | EPA PPLS ORDS API |

## Project Structure

```
epa-label-viewer-poc/
├── backend/
│   ├── src/
│   │   ├── index.js            # Express app entry point
│   │   ├── routes/
│   │   │   └── pesticides.js   # /api/pesticides/* route handlers
│   │   └── services/
│   │       └── epaService.js   # EPA PPLS API wrapper
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── epaApi.js       # Fetch wrappers for the backend API
│   │   ├── components/
│   │   │   ├── SearchPanel.jsx # Search input + button
│   │   │   ├── ResultsList.jsx # Scrollable search results
│   │   │   └── PdfViewer.jsx   # Iframe-based PDF display
│   │   ├── App.jsx             # App shell / state management
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Local Development

### Prerequisites

- Node.js ≥ 18

### 1. Start the backend

```bash
cd backend
npm install
npm run dev      # starts on http://localhost:3001  (nodemon)
# or
npm start        # no hot-reload
```

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev      # starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser. The Vite dev server proxies `/api/*` requests to the backend automatically.

## API Endpoints

| Method | Path                              | Description                        |
|--------|-----------------------------------|------------------------------------|
| GET    | `/api/health`                     | Health check                       |
| GET    | `/api/pesticides/search?q=<term>` | Search products by keyword         |
| GET    | `/api/pesticides/product/:regNo`  | Fetch product details + label URL  |

## Data Source

All product data comes from the [EPA PPLS ORDS API](https://ordspub.epa.gov/ords/pesticides/ppls/).  
No scraping, no database, no auth — pure API calls.

## Notes

- This is a standalone POC. It is intentionally kept simple.
- No authentication, no database, no user accounts.
- The frontend uses the browser's built-in PDF renderer (`<iframe>`) to display label PDFs.
