# WeatherIQ AI - Full Stack Weather Intelligence Portal

WeatherIQ AI is a production-quality, high-fidelity Full-Stack Weather Portal satisfying all requirements for both **Tech Assessment #1 (Frontend)** and **Tech Assessment #2 (Backend)**. 

Designed with a premium dark-mode-first glassmorphic styling system (degrading gracefully to cohesive light themes), it handles live geocoded coordinate lookups, maps geolocated searches, pulls matching travel visual media, records search histories to MongoDB via CRUD routing, exports collections into multiple structures, and implements complete offline caching capability.

---

## 🚀 TECH STACK

- **Frontend**: React (Vite), Tailwind CSS (v4), Axios, SWR (React Cache & Fetching layer), Lucide React
- **Backend**: Node.js + Express.js (REST API architecture)
- **Database**: MongoDB with Mongoose ODM (TTL caching + relational querying)
- **Data Export Engines**: json2csv, fast-xml-parser, pdfkit, markdown-it
- **Orchestration**: concurrently (concurrent development runner)

---

## 🛠️ PREREQUISITES

- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local Community Server running at `mongodb://localhost:27017` or MongoDB Atlas cloud connection string
- **Required API Keys**:
  - **OpenWeatherMap API Key**: Free key from [OpenWeatherMap](https://openweathermap.org/) (for current conditions and 5-day forecast).
  - **Google Maps API Key**: Key with *Geocoding API* and *Maps Embed API* enabled from [Google Cloud Console](https://console.cloud.google.com/).
  - **YouTube Data API v3 Key**: Key with *YouTube Data API v3* enabled from [Google Cloud Console](https://console.cloud.google.com/).

---

## 📂 DIRECTORY STRUCTURE

```
weather-app/
├── client/              (React frontend)
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.jsx      (GPS Geolocation + Landmarks search)
│   │   │   ├── WeatherCard.jsx    (Local time + Temperature grid)
│   │   │   ├── ForecastGrid.jsx   (Responsive 5-day columns)
│   │   │   ├── MapEmbed.jsx       (Google Maps place markers + OSM Fallback)
│   │   │   ├── YouTubePanel.jsx   (City travel guides iframe panels)
│   │   │   ├── ExportPanel.jsx    (JSON/CSV/XML/PDF/MD blob downloads)
│   │   │   └── ErrorBanner.jsx    (Unified dismissable warning banner)
│   │   ├── pages/
│   │   │   ├── Home.jsx           (Dashboard layout control)
│   │   │   └── History.jsx        (Historic query logs CRUD panel)
│   │   ├── App.jsx                (Theme controller + routing)
│   │   └── index.css              (Glassmorphic styles + variables)
│   └── package.json
├── server/              (Express backend)
│   ├── routes/
│   │   ├── weather.js             (Current conditions & forecasts)
│   │   ├── queries.js             (CRUD Search Log operations)
│   │   ├── export.js              (Multi-format database downloads)
│   │   └── youtube.js             (Travel video searches)
│   ├── models/
│   │   ├── Query.js               (Historical Query MongoDB Model)
│   │   └── WeatherCache.js        (MongoDB 1-hour TTL Cache Model)
│   ├── controllers/
│   │   ├── weatherController.js
│   │   ├── queryController.js
│   │   └── exportController.js
│   ├── middleware/
│   │   └── errorHandler.js        (Unified JSON error response formatter)
│   └── index.js
├── .env                 (Environment variables config - shared)
└── package.json         (Root orchestration script)
```

---

## ⚙️ INSTALLATION & SETUP

### 1. Clone & Install Dependencies
Run the unified installer script from the project root. This installs root dev dependencies, server dependencies, and client packages concurrently:
```bash
npm run install-all
```
*Alternatively, you can manually run `npm install` inside the root, `server/`, and `client/` directories.*

### 2. Configure Environment Variables
Create a `.env` file in the **root** folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_uri
OPENWEATHER_API_KEY=your_openweathermap_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
YOUTUBE_API_KEY=your_youtube_api_key
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```
*An `.env.example` template has been provided in the root directory for standard cloning.*

---

## 🏃‍♂️ RUNNING THE APPLICATION

### Development Environment (Concurrent Mode)
Spin up both the React frontend and the Express backend server concurrently with a single command from the root directory:
```bash
npm run dev
```
- **React Frontend**: `http://localhost:5173`
- **Express Backend**: `http://localhost:5000`

### Production Compilation
1. Build the frontend:
   ```bash
   npm run build --prefix client
   ```
2. Start the production backend server:
   ```bash
   npm run start --prefix server
   ```

---

## 🌐 API ENDPOINT DOCUMENTATION

All backend routes are structured logically and return uniform, standardized JSON responses:

### 1. Weather Module
- **`GET /api/weather/current?location=<query>`**
  - **Params**: `location` (can be city name, ZIP code, GPS coordinates, or landmark).
  - **Action**: Resolves location coordinates via Google Geocoding, queries OpenWeatherMap current metrics, caches the result in MongoDB with a 1-hour expiration index, and returns structured climate stats.
- **`GET /api/weather/forecast?location=<query>`**
  - **Params**: `location` or coordinates `lat`/`lon`.
  - **Action**: Queries 5-day/3-hour forecasts, compiles 3-hourly intervals into standard daily highs/lows and maps weather description codes to day-name objects.

### 2. Historical CRUD Module (`/api/queries`)
- **`POST /api/queries`**
  - **Body**: `{ location, dateFrom, dateTo, notes? }`
  - **Action**: Validates dates (ISO-compliant, start before end, range <= 30 days). Resolves coordinates, fetches historic ranges from free Open-Meteo API, and saves query details + day logs + custom notes to the database.
- **`GET /api/queries`**
  - **Query Params**: `?location=<fuzzy_filter>&limit=20&skip=0`
  - **Action**: Retrieves all saved searches sorted in descending order of creation.
- **`GET /api/queries/:id`**
  - **Action**: Returns a single query document.
- **`PUT /api/queries/:id`**
  - **Body**: `{ location?, dateFrom?, dateTo?, notes? }`
  - **Action**: Validates inputs. If coordinates or dates are updated, it re-queries Open-Meteo and replaces the saved daily list, returning the modified record.
- **`DELETE /api/queries/:id`**
  - **Action**: Removes a search record from the database.

### 3. Media & Exports
- **`GET /api/youtube?location=<city>`**
  - **Action**: Queries YouTube Search API for `<city> travel 4K`, returning the top 3 items. Degrades gracefully to curated visuals if VITE keys are missing.
- **`GET /api/export?format=json|csv|xml|pdf|markdown`**
  - **Action**: Queries the entire history collection and returns download binaries:
    - `csv`: formats logs into tables using `json2csv`.
    - `xml`: compiles tags with `fast-xml-parser` builder.
    - `pdf`: renders text coordinates summaries and dividers using `pdfkit`.
    - `markdown`: returns a standard GFM Markdown table.

---

## ✅ FEATURE CHECKLIST

- [x] **FEATURE 1: Location Inputs & Live Weather** (Cities, ZIP codes, exact GPS inputs, and landmarks support. Responsive cards with local offset time tracking).
- [x] **FEATURE 2: 5-Day forecast grids** (Groups OpenWeatherMap 3-hour lists into daily summaries with weekday name markers).
- [x] **FEATURE 3: MongoDB historical CRUD** (Saves historical weather ranges via Open-Meteo using a 30-day validator constraint).
- [x] **FEATURE 4: History UI** (Dynamic CRUD log panels offering inline edits, deletes, and creation).
- [x] **FEATURE 5: Map Embedding** (Google Maps iframe embeds with full OpenStreetMap Nominatim keyless coordinate fallback).
- [x] **FEATURE 6: YouTube Panel** (Embeds city travel guides with a keyless fallback visual thumbnail engine).
- [x] **FEATURE 7: Multi-Format Data Exports** (Allows downloading full histories as CSV, XML, PDF reports, Markdown tables, and raw JSON).
- [x] **FEATURE 8: Error Handling** (Unified Express JSON error responses, client-side input validation, and rate limit checks).
- [x] **FEATURE 9: Responsive Design** (Adapts layouts dynamically across mobile, tablet, and desktop viewports using Tailwind CSS).
- [x] **FEATURE 10: Academic / Affiliate Branding** (Credits developer name "YOUR_NAME_HERE" and showcases PM Accelerator's description in the footer).

---

## 🎨 DESIGN SYSTEMS

WeatherIQ AI employs a premium, futuristic dark-glass layout incorporating HSL styling:
- **Glassmorphic panels**: High-blur backdrops with subtle border overlays to deliver high contrast.
- **Sleek micro-animations**: Custom transition scaling (`hover-scale`) and clock pulses for responsive buttons.
- **Contrast Ratios**: Verified dark and light gradients, accessible text sizes, and descriptive loaders for a gorgeous experience.
