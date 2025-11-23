# Linda - Private Location Sharing

A location-sharing mobile app with privacy controls built with Expo, React Native, and Self Protocol for identity verification.

## Quick Start

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Self Protocol credentials and backend settings.

### 3. Start Development Server

```bash
npm start
```

Then choose your platform:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Press `w` for web
- Scan QR code with Expo Go app for physical device

## Development Commands

```bash
npm start          # Start Expo dev server
npm run android    # Start on Android
npm run ios        # Start on iOS
npm run web        # Start on web
npm run lint       # Run ESLint
```

> [!CAUTION]
> If your local WiFi blocks traffic run `npx expo start --tunnel -c`

## Tech Stack

- **Expo SDK 54** - React Native framework
- **TypeScript** - Type safety
- **Expo Router** - File-based navigation
- **Tailwind CSS** (NativeWind) - Styling
- **Self Protocol** - Identity verification
- **Expo Location** - Location services

## Project Structure

```
app/              # Expo Router screens
components/       # Reusable components
  ui/            # UI components (Button, LoadingSpinner)
context/         # React Context (UserContext)
services/        # API services (skeleton)
types/           # TypeScript types
utils/           # Utility functions
```

## Features

- ✅ Self Protocol authentication
- ✅ Location permission handling
- ✅ Privacy levels (city-level or real-time)
- 🚧 Map view (in progress)
- 🚧 Backend integration (pending)

## MVP Approach

This is an MVP project. Code is kept **simple, minimal, and intuitive**:
- No over-engineering
- Extract components only when duplicated
- Tailwind CSS over StyleSheet
- Flat structures preferred

See `CLAUDE.md` for detailed development guidelines.

## Backend

The app is designed to work with a Docker-based backend. Configure the API endpoint in `.env.local`:

```bash
EXPO_PUBLIC_API_PORT=3000
# EXPO_PUBLIC_API_URL=https://your-backend.com  # Optional override
```

## License

MIT
