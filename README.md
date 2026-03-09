# Note Maker - Voice-First AI Note App

A full-stack, voice-first AI note-taking application that captures thoughts quickly and automatically converts them into structured notes, tasks, goals, and tags using the Gemini API.

## Features

- **Quick Capture**: Instantly capture thoughts using text or your voice (via the browser's native Web Speech API).
- **AI Processing Pipeline**: Automatically analyzes your notes using Google's Gemini AI to extract:
  - Smart Titles
  - Summaries
  - Contextual Tags
  - Actionable Tasks
  - Long-term Goals
  - Deadlines
- **Timeline Feed**: Clean, timeline-based feed of all your thoughts, tasks, and ideas.
- **Dark Minimalist UI**: Beautiful, mobile-first design built with Tailwind CSS v4 and shadcn/ui.
- **Cross-device Access**: Responsive web app that works on your desktop and your phone.

## Tech Stack

### Frontend (`/client`)
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui, Lucide Icons
- **State/Fetching**: SWR, standard Fetch API

### Backend (`/server`)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (raw SQL queries using `pg`)
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs
- **AI Integration**: `@google/generative-ai` (Gemini 1.5/2.5 Flash)

## Project Structure

```bash
/note-maker
├── /client      # Next.js Frontend Application
└── /server      # Node.js + Express Backend Application
```

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Google Gemini API Key

### 1. Database Setup
Ensure you have a PostgreSQL instance running. Create a database for the application (e.g., `notemaker`). The Express server will automatically run the schema and create tables on startup.

### 2. Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory and add your credentials:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://username:password@localhost:5432/notemaker
   JWT_SECRET=your_super_secret_jwt_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Testing on Local Network (Mobile)
To test the app on your phone:
1. Ensure both your computer and phone are on the same Wi-Fi network.
2. The Express server is bound to `0.0.0.0` and accepts CORS from any origin during development.
3. Open your phone's browser and navigate to your computer's local IP address on port 3000 (e.g., `http://192.168.x.x:3000`).
4. *Note: Voice recording requires a secure context (HTTPS) on mobile browsers, but text entry and AI processing will work flawlessly.*

## License
MIT
