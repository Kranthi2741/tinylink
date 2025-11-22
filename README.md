# TinyLink - URL Shortener

A full-stack web application for shortening URLs, similar to bit.ly. Built with Node.js, Express, and PostgreSQL, featuring a clean dashboard for managing links, tracking click statistics, and viewing detailed analytics.

## 🚀 Features

### Core Functionality
- **Create Short Links**: Convert long URLs into short, shareable links
- **Custom Codes**: Optionally specify custom short codes (6-8 alphanumeric characters)
- **Smart Redirects**: HTTP 302 redirects to original URLs with click tracking
- **Click Analytics**: Track total clicks and last clicked timestamp for each link
- **Link Management**: Delete links with automatic 404 handling after deletion
- **Search & Filter**: Search links by code or URL, sort by various criteria

### Pages & Routes
- **Dashboard** (`/`): Main interface for creating, viewing, and managing links
- **Stats Page** (`/code/:code`): Detailed statistics for individual links
- **Redirect** (`/:code`): Short URL redirect endpoint
- **Health Check** (`/healthz`): System status and uptime information

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (Neon)
- **Frontend**: Vanilla JavaScript + Tailwind CSS
- **Hosting**: Render (Backend) + Neon (Database)

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (Neon recommended for free hosting)
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd tinylink
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   DATABASE_URL=postgres://user:password@host:port/database?sslmode=require
   PORT=3000
   BASE_URL=http://localhost:3000
   ```

4. **Initialize the database**
   ```bash
   npm run db:init
   ```
   
   This creates the `links` table with the following schema:
   - `id` (SERIAL PRIMARY KEY)
   - `short_code` (VARCHAR(20) UNIQUE NOT NULL)
   - `original_url` (TEXT NOT NULL)
   - `clicks` (INT DEFAULT 0)
   - `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
   - `last_clicked` (TIMESTAMP)

5. **Start the server**
   ```bash
   node server.js
   ```

   The application will be available at `http://localhost:3000`

## 🌐 API Endpoints

### Create Link
```http
POST /api/links
Content-Type: application/json

{
  "url": "https://example.com/very/long/url",
  "customCode": "optional"  // 6-8 alphanumeric characters
}
```

**Response (201)**:
```json
{
  "shortUrl": "http://localhost:3000/abc123",
  "data": {
    "id": 1,
    "short_code": "abc123",
    "original_url": "https://example.com/very/long/url",
    "clicks": 0,
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_clicked": null
  }
}
```

**Error (409)**: Code already exists
**Error (400)**: Invalid URL or code format

### List All Links
```http
GET /api/links?search=query&sort=newest
```

**Query Parameters**:
- `search` (optional): Filter by code or URL
- `sort` (optional): `newest`, `oldest`, `most-clicked`, `least-clicked`

**Response (200)**:
```json
[
  {
    "id": 1,
    "short_code": "abc123",
    "original_url": "https://example.com",
    "clicks": 42,
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_clicked": "2024-01-15T12:30:00.000Z"
  }
]
```

### Get Link Stats
```http
GET /api/links/:code
```

**Response (200)**:
```json
{
  "id": 1,
  "short_code": "abc123",
  "original_url": "https://example.com",
  "clicks": 42,
  "created_at": "2024-01-01T00:00:00.000Z",
  "last_clicked": "2024-01-15T12:30:00.000Z"
}
```

**Error (404)**: Link not found

### Delete Link
```http
DELETE /api/links/:code
```

**Response (200)**:
```json
{
  "message": "Deleted successfully"
}
```

**Error (404)**: Link not found

### Health Check
```http
GET /healthz
```

**Response (200)**:
```json
{
  "ok": true,
  "version": "1.0",
  "uptime": 12345.67,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "status": "running"
}
```

## 📁 Project Structure

```
tinylink/
├── controllers/
│   └── linkController.js    # Business logic for link operations
├── routes/
│   └── linkRoutes.js         # API route definitions
├── public/
│   ├── index.html            # Dashboard page
│   ├── app.js                # Dashboard JavaScript
│   ├── stats.html            # Stats page
│   ├── stats.js              # Stats page JavaScript
│   └── style.css             # Additional styles
├── scripts/
│   └── init-db.js            # Database initialization script
├── db.js                     # Database connection pool
├── server.js                 # Express server setup
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## 🚢 Deployment

### Deploying to Render

1. **Create a Render account** and connect your GitHub repository

2. **Create a new Web Service**:
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment Variables:
     - `DATABASE_URL`: Your Neon PostgreSQL connection string
     - `PORT`: Leave blank (Render assigns automatically)
     - `BASE_URL`: Your Render service URL (e.g., `https://tinylink-xxx.onrender.com`)

3. **Set up Neon Database**:
   - Create a free PostgreSQL database at [Neon](https://neon.tech)
   - Copy the connection string to your Render environment variables

4. **Initialize the database**:
   - After deployment, run the database initialization:
     ```bash
     npm run db:init
     ```
   - Or use Render's shell to run the command

### Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 3000)
- `BASE_URL`: Base URL for generating short links

## 🎨 Features in Detail

### Short Code Rules
- **Auto-generated**: 6 alphanumeric characters (A-Za-z0-9)
- **Custom codes**: 6-8 alphanumeric characters only
- **Validation**: Must match pattern `[A-Za-z0-9]{6,8}`
- **Uniqueness**: Codes are globally unique across all users

### URL Validation
- Must be a valid HTTP or HTTPS URL
- Validated before saving to database
- Returns 400 error for invalid URLs

### Redirect Behavior
- **Active links**: HTTP 302 redirect to original URL
- **Deleted links**: HTTP 404 "Short URL not found"
- **Click tracking**: Automatically increments on each redirect
- **Last clicked**: Updates timestamp on each redirect

### Dashboard Features
- Real-time link creation
- Search by code or URL
- Sort by date or click count
- Delete with confirmation
- View detailed stats per link
- Responsive design for mobile/desktop

