# WeatherIQ AI - Full Stack Weather Intelligence Portal

WeatherIQ AI is a production-quality, high-fidelity Full-Stack Weather Portal satisfying all requirements for both **Tech Assessment #1 (Frontend)** and **Tech Assessment #2 (Backend)**. 

Designed with a premium dark-mode-first glassmorphic styling system (degrading gracefully to cohesive light themes), it handles live geocoded coordinate lookups, maps geolocated searches, pulls matching travel visual media, records search histories to MongoDB via CRUD routing, exports collections into multiple structures, offers secure session logins, and implements complete offline caching capability.

---

## 🚀 TECH STACK

- **Frontend**: React (Vite), Tailwind CSS (v4), Axios, SWR (React Cache & Fetching layer), Lucide React
- **Backend**: Node.js + Express.js (REST API architecture)
- **Database**: MongoDB with Mongoose ODM (TTL caching + relational querying)
- **AI Integration**: Google Gemini API (`gemini-1.5-flash` system instruction model)
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
  - **Google Gemini API Key**: Key from [Google AI Studio](https://aistudio.google.com/) (for conversational AI Weather Narrator briefings).

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
│   │   │   ├── YouTubePanel.jsx   (City travel guides iframe panels with custom YouTube SVGs)
│   │   │   ├── ExportPanel.jsx    (JSON/CSV/XML/PDF/MD blob downloads)
│   │   │   └── ErrorBanner.jsx    (Unified dismissable warning banner)
│   │   ├── pages/
│   │   │   ├── Home.jsx           (Dashboard layout + Gemini Briefing panel)
│   │   │   ├── History.jsx        (Historic query logs CRUD panel)
│   │   │   ├── Login.jsx          (Session authentication logins)
│   │   │   └── Signup.jsx         (Create new profile page)
│   │   ├── context/
│   │   │   └── AuthContext.jsx    (User sessions provider)
│   │   ├── App.jsx                (Theme controller + routing + PM Accelerator footer)
│   │   └── index.css              (Glassmorphic styles + variables)
│   └── package.json
├── server/              (Express backend)
│   ├── routes/
│   │   ├── weather.js             (Current conditions & forecasts)
│   │   ├── queries.js             (CRUD Search Log operations)
│   │   ├── export.js              (Multi-format database downloads)
│   │   ├── youtube.js             (Travel video searches)
│   │   └── authRoutes.js          (Session authentication endpoints)
│   ├── models/
│   │   ├── Query.js               (Historical Query MongoDB Model)
│   │   ├── User.js                (Encrypted User Session Model)
│   │   └── WeatherCache.js        (MongoDB 1-hour TTL Cache Model)
│   ├── controllers/
│   │   ├── weatherController.js   (Includes Google Gemini integration)
│   │   ├── queryController.js     (Open-Meteo fallback routing engines)
│   │   ├── exportController.js
│   │   └── authController.js
│   ├── middleware/
│   │   ├── auth.js                (JWT Bearer Shield)
│   │   └── errorHandler.js        (Unified JSON error response formatter)
│   └── index.js
├── .env                 (Environment variables config - shared)
├── .gitignore           (Recursive secrets shielding)
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
GEMINI_API_KEY=your_google_gemini_api_key
JWT_SECRET=your_jwt_secret_super_secure
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

### 1. Weather & AI Narrative Module
- **`GET /api/weather/current?location=<query>`**
  - **Params**: `location` (can be city name, ZIP code, GPS coordinates, or landmark).
  - **Action**: Resolves coordinates, fetches OpenWeatherMap current + forecast data, compiles it, and **queries the Google Gemini API (`gemini-1.5-flash`)** using customized system instructions. Caches both the weather stats and the generated AI Narrative inside MongoDB with a 1-hour expiration index, ensuring rate limit safety.

### 2. Historical CRUD Module (`/api/queries`)
- **`POST /api/queries`**
  - **Body**: `{ location, dateFrom, dateTo, notes? }`
  - **Action**: Validates dates (ISO-compliant, range <= 30 days). Resolves coordinates, fetches historical daily ranges from Open-Meteo. **Features an intelligent fallback router**: if historical `/v1/archive` returns a 400 (due to current or future dates), the server automatically redirects the request to Open-Meteo's `/v1/forecast` endpoint to fetch the weather successfully!
- **`GET /api/queries`**
  - **Action**: Retrieves all saved searches sorted in descending order of creation.
- **`PUT /api/queries/:id`**
  - **Body**: `{ location?, dateFrom?, dateTo?, notes? }`
  - **Action**: Fully updates the query's location, start, end, or notes. If location or dates change, it automatically re-geocodes and re-queries Open-Meteo with the same forecast fallback router!

### 3. Session User Authentication (`/api/auth`)
- **`POST /api/auth/signup`**: Creates an encrypted profile using `bcrypt` pre-save salts.
- **`POST /api/auth/login`**: Authenticates credentials and returns a signed `jsonwebtoken` session token.
- **`GET /api/auth/me`**: Protected profile loader verifying valid JWT headers.

---

## ✅ SYSTEM FEATURE LIST

- [x] **1. Location Inputs & Live Weather Resolution**
  - Resolves standard searches by city names, ZIP codes, and landmark names (e.g., "Eiffel Tower").
  - Employs direct client-side parsing of exact coordinates (e.g. `48.8584,2.2945`) to optimize speed.
  - Displays localized clock offsets, temperature variations, real-time weather icons, and interactive conditions cards.
- [x] **2. Interactive Maps & OSM Fallback**
  - Renders interactive locations in Google Maps iframe panels.
  - Automatically falls back to an open-source Leaflet map widget using OpenStreetMap tiles recursively if the API key is not configured.
- [x] **3. AI Weather Narrator (Google Gemini API)**
  - Sends temperature stats and forecast vectors directly to the **Google Gemini API (`gemini-1.5-flash`)** using structured system instructions.
  - Writes a customized 3-sentence conversational weather reporter briefing (under 60 words) highlighting feel, activity advice, and upcoming week insights.
  - Showcases briefings inside an elegant "AI Insight" container with a custom sparkling icon.
  - Employs graceful local code-based fallbacks if no Gemini key is provided, ensuring zero downtime.
- [x] **4. MongoDB 1-Hour Cache & Rate-Limit Shield**
  - Caches current geolocated conditions and Gemini briefings under Mongoose structures.
  - Configures a MongoDB `expires: 3600` (1-hour TTL) automatic collection wipe to prevent API rate-limit exhaustion and eliminate redundant Gemini API key re-calls.
- [x] **5. Interactive YouTube Travel Guides**
  - Dynamically searches and matches the top 3 high-definition travel guides for the queried city using the YouTube Data API v3.
  - Features high-fidelity iframe displays with custom vector branding overlays.
- [x] **6. 5-Day Forecast Grid**
  - Aggregates OpenWeatherMap 3-hour forecasts into daily high/low summaries.
  - Uses dynamic columns that stack smoothly into singular rows on narrow screen viewports.
- [x] **7. Historical CRUD Queries**
  - Creates, reads, updates, and deletes query logs inside MongoDB.
  - Embeds interactive inline forms to alter dates, notes, and locations easily on the history panel.
- [x] **8. Open-Meteo Fallback Router**
  - Automatically checks if date limits exceed Open-Meteo's standard historical `/v1/archive` restrictions.
  - Dynamically reroutes current or future dates to the `/v1/forecast` API, avoiding standard `400 Bad Request` exceptions seamlessly.
- [x] **9. Secure User Authentication & Session Sync**
  - Registers profiles securely using salted `bcrypt` storage and logs users in with JWT tokens.
  - Restricts dashboard history panels and tracks user queries dynamically.
- [x] **10. Multi-Format Data Exporter**
  - Downloads saved query records directly from the React dashboard.
  - Compiles lists into CSV tables, XML schemas, Markdown sheets, raw JSON files, or professional PDF reports (crafted using `pdfkit`).

---

## 🎓 PM ACCELERATOR AFFILIATE BRANDING & CREDITS

- **Developer Credits**: Prominently displays developer credits for **Miriyala Sahasra** across browser tab titles, header page titles, and styled footer panels.
- **Affiliate Branding**: Showcases the detailed two-paragraph Product Manager Accelerator Program Overview in a dark/light mode glassmorphic footer panel, including active hyperlinked redirects to their official LinkedIn school page: `https://www.linkedin.com/school/pmaccelerator/`.

