# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Expo React Native application called "Linda" - a location-sharing app with privacy controls built with TypeScript and Expo Router for file-based navigation. The project uses Expo SDK 54 with the new architecture enabled and React Compiler experimental features.

**⚠️ MVP-FIRST APPROACH**

This is an **MVP (Minimum Viable Product)** project. When working on this codebase:

- **Keep code simple, minimal, and intuitive**
- **Avoid over-engineering** - Don't add features/abstractions until they're needed
- **Extract only when duplicated** - Don't create shared components/utilities until they're used 2-3 times
- **Flat structure over deep nesting** - Prefer simple, flat code structures
- **YAGNI principle** - "You Aren't Gonna Need It" - only build what's immediately necessary

## Development Commands

**Install dependencies:**
```bash
npm install
```

**Start development server:**
```bash
npx expo start
# or
npm start
```

**Platform-specific commands:**
```bash
npm run android  # Start on Android emulator
npm run ios      # Start on iOS simulator
npm run web      # Start for web
```

**Lint:**
```bash
npm run lint
```

## Architecture

### Routing Architecture

The app uses Expo Router with file-based routing and route protection based on authentication state:

- **Root Layout** (`app/_layout.tsx`): Wraps the entire app with `SessionProvider` and manages route guards
- **Protected Routes**: Routes in `app/(app)/` require authentication (session exists)
- **Public Routes**: `app/sign-in.tsx` is only accessible when not authenticated
- **Route Groups**: The `(app)` directory is a route group (parentheses are excluded from the URL path)

Route guards use `Stack.Protected` with guard conditions that automatically redirect:
- Authenticated users trying to access `/sign-in` are redirected to the app
- Unauthenticated users trying to access app routes are redirected to `/sign-in`

### Authentication Flow

Authentication is managed through a Context API pattern:

1. **SessionProvider** (`components/ctx.tsx`): Provides authentication state and actions
2. **useSession hook**: Accesses authentication context from any component
3. **Storage**: Uses `expo-secure-store` for native platforms and `localStorage` for web
4. **Session State**: Currently a simple string ("true" when signed in, null when signed out)

The authentication implementation in `useStorageState` hook handles platform-specific storage:
- Native (iOS/Android): Uses `expo-secure-store` for encrypted storage
- Web: Uses browser `localStorage`

### Location & User State

Location and user preferences are managed via **UserContext**:

1. **UserProvider** (`context/UserContext.tsx`): Manages sharing level and location data
2. **useUser hook**: Access user location and privacy settings
3. **Privacy Levels**:
   - `'city'` - Share only city-level location
   - `'realtime'` - Share exact GPS coordinates

### Friends Management

Friends list is managed via **FriendsContext**:

1. **FriendsProvider** (`context/FriendsContext.tsx`): Manages friends list with mock data
2. **useFriends hook**: Access friends list and add/remove friends
3. **Mock Data**: Currently uses hardcoded friends for MVP (4 sample friends)

### Map Features

The map screen (`app/(app)/map/index.tsx`) includes:

- **Dynamic marker pooling**: Groups friends by city when zoomed out
- **Real-time markers**: Shows individual markers for real-time sharers when zoomed in
- **Privacy-aware**: Respects each friend's sharing level (city vs real-time)
- **Friend details modal**: Tap markers to view friend information
- **Center on location**: Button to center map on user's location
- **Settings navigation**: Top-right settings icon navigates to `/settings`

### Backend Integration (Docker)

The app is designed to work with a Docker-based backend:

- **Platform-specific URLs**: API client automatically detects platform and uses correct URL
  - Android Emulator: `http://10.0.2.2:3000`
  - iOS Simulator: `http://localhost:3000`
  - Physical Device: Uses Expo's debugger host IP
- **Service Layer**: All API calls go through service functions (not yet implemented)
- **Configuration**: See `.env.local` for API settings

### Path Aliases

The project uses `@/*` as a path alias that resolves to the project root, configured in `tsconfig.json`. Use this for all imports:

```typescript
import { useSession } from '@/components/ctx';
import { Button, LoadingSpinner } from '@/components/ui';
import { authService, userService } from '@/services';
import type { SharingLevel, LocationData } from '@/types';
```

## Project Structure

```
app/
├── _layout.tsx              # Root layout with SessionProvider and route guards
├── sign-in.tsx              # Sign-in screen (public route)
├── auth-callback.tsx        # Self Protocol auth callback handler
└── (app)/                   # Protected app routes (route group)
    ├── _layout.tsx          # App layout with UserProvider and FriendsProvider
    ├── index.tsx            # Location preference setup screen
    ├── map/
    │   └── index.tsx        # Map screen with friend markers
    └── settings/
        └── index.tsx        # Settings screen with 3 tabs (Profile, Privacy, Friends)

components/
├── ctx.tsx                  # SessionProvider and useSession hook
└── ui/                      # Reusable UI components
    ├── index.ts             # Central export
    ├── Button.tsx           # Standardized button (primary/secondary/danger)
    └── LoadingSpinner.tsx   # Reusable loading state

context/
├── UserContext.tsx          # User state management (location, sharing level)
└── FriendsContext.tsx       # Friends list management (mock data for MVP)

hooks/
└── useStorageState.ts       # Platform-agnostic persistent storage hook

types/                       # TypeScript type definitions
├── index.ts                 # Central export for all types
├── user.types.ts            # User, SharingLevel, UserContextType
├── location.types.ts        # LocationData, Coordinates, FriendLocation
└── map.types.ts             # Map-related types (Region, PooledMarker)

services/                    # Backend API communication (skeletons)
├── index.ts                 # Central export
├── api.ts                   # Base API client with Docker support
├── auth.service.ts          # Authentication endpoints
├── user.service.ts          # User CRUD operations
└── location.service.ts      # Location sharing endpoints

constants/
└── mapConstants.ts          # Map configuration and styling

utils/
└── getDistance.ts           # Haversine distance calculation
```

## Key Patterns

### Import Patterns

Always use centralized exports from index files:

```typescript
// ✅ Good - centralized imports
import { Button, LoadingSpinner } from '@/components/ui';
import { authService, userService, locationService } from '@/services';
import type { SharingLevel, LocationData } from '@/types';

// ❌ Bad - individual file imports
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';
```

### UI Components

All UI components use **Tailwind CSS** via NativeWind - no StyleSheet required:

```typescript
// ✅ Good - Tailwind classes
<View className="flex-1 justify-center items-center bg-white">
  <Text className="text-xl font-bold text-gray-900">Hello</Text>
</View>

// ❌ Bad - StyleSheet (avoid for new code)
const styles = StyleSheet.create({ ... });
```

**Reusable Components:**
- `<Button />` - Use for all buttons (provides TouchableOpacity, variants, disabled state)
- `<LoadingSpinner />` - Use for all loading states

### Service Layer (Backend Integration)

Services are **skeleton implementations** ready for backend:

```typescript
// Currently throws errors - implement when backend is ready
import { userService } from '@/services';

// To activate, just uncomment the API call:
export const getProfile = async (userId: string) => {
  return api.get(`/users/${userId}`);  // Uncomment when ready
};
```

### Type Organization

Types are organized by domain and centrally exported:

- **user.types.ts** - User-related types
- **location.types.ts** - Location-related types
- No API wrapper types (e.g., `ApiResponse<T>`) - keep it simple for MVP

### Splash Screen Management

The app uses `expo-splash-screen` to prevent the splash screen from hiding until authentication state is determined:
- `SplashScreen.preventAutoHideAsync()` is called at module level in `app/_layout.tsx`
- Splash screen hides when `isLoading` becomes false (auth state determined)
- Navigation doesn't render until auth state is known

### Storage State Hook

`useStorageState` returns a tuple: `[[isLoading, value], setValue]`
- First render always has `isLoading: true` while fetching from storage
- Automatically syncs in-memory state with persistent storage
- Platform detection happens automatically

### Context Usage

Always use the `use()` hook from React 19 to consume context:
```typescript
const value = use(AuthContext);
```

### Settings Page Pattern

The settings page demonstrates MVP principles:

- **Single file implementation** - All 3 tabs (Profile, Privacy, Friends) in one file (`app/(app)/settings/index.tsx`)
- **Inline tab components** - Tab components defined inline, not extracted to separate files
- **Simple tab state** - Uses local `activeTab` state, no custom TabView component
- **100% Tailwind CSS** - No StyleSheet usage
- **Native components** - Alert for confirmations, Modal for add friend
- **Existing contexts** - Leverages `useUser`, `useFriends`, `useSession` hooks

## Configuration

- **New Architecture**: Enabled (`newArchEnabled: true`)
- **React Compiler**: Experimental feature enabled
- **Typed Routes**: Expo Router generates TypeScript types for routes
- **TypeScript**: Strict mode enabled
- **Edge-to-Edge**: Enabled on Android
- **Scheme**: `linda://` for deep linking
- **Tailwind CSS**: Enabled via NativeWind
- **Maps**: `react-native-maps` is included in Expo Go SDK 54 - DO NOT add it to `app.json` plugins

## Self Protocol Integration

The app uses Self Protocol for identity verification:

- **Sign-in Flow**: Deep link to Self app → User verifies → Callback to `linda://auth-callback`
- **Configuration**: See `.env.local` for Self app settings
- **Dev Login**: Red "DevLogin" button bypasses Self for development

## MVP Development Guidelines

When adding new features:

1. **Start simple** - Build the most basic version first
2. **Inline first** - Write code inline, extract to functions/components only when duplicated
3. **Avoid premature abstraction** - Don't create services/utilities until you need them 2-3 times
4. **Question complexity** - If something feels over-engineered, it probably is
5. **Tailwind over StyleSheet** - Use className with Tailwind classes
6. **Flat over nested** - Prefer flat structures and simple code

**Examples of MVP thinking:**
- ✅ Use template strings instead of creating a `formatLocation()` helper
- ✅ Keep button code inline until you use buttons in 3+ places
- ✅ Use simple `any` types instead of complex generics (for non-critical code)
- ✅ Settings page: Single file with inline tab components (not separate files)
- ✅ Settings page: Simple `activeTab` state instead of custom TabView component
- ❌ Don't create a `DateUtils` class with one function
- ❌ Don't add error boundaries until you actually need them
- ❌ Don't create complex state machines for simple boolean flags
- ❌ Don't extract components into separate files until used 2-3 times
