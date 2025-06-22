# Environment Variable Configuration

This document explains the environment variable structure for the Firebase React application following Firebase best practices.

## Overview

The project uses a clean separation between frontend (Vite/React) and backend (Cloud Functions) environment variables:

- **Frontend variables**: Located in root `.env` file with `VITE_` prefix
- **Backend variables**: Set directly in function code (recommended approach)

## Environment Files Structure

### Root `.env` (Frontend Variables)
**Location**: `c:\Users\rajar\Desktop\rajarshi mess\.env`

Contains all Vite-prefixed variables for the React frontend:
- Firebase project configuration
- Emulator connection settings
- Development flags

All variables use the `VITE_` prefix to be accessible in the React application.

### Cloud Functions (Backend Variables)
**Location**: `functions/src/index.ts`

Following Firebase documentation recommendations, the region and other backend configurations are set directly in the function definitions rather than using `.env` files. This approach:
- Avoids `.env` parsing issues
- Follows Firebase best practices for Cloud Functions v2
- Ensures reliable region configuration

## Key Configuration

### Firebase Region
- **Frontend**: `VITE_FIREBASE_REGION=asia-south1` (in root `.env`)
- **Backend**: `const FIREBASE_REGION = 'asia-south1'` (in function code)

### Emulator Configuration
All emulator endpoints are configured via `VITE_` prefixed variables in the root `.env` file:
- Authentication: `localhost:9099`
- Firestore: `localhost:8080`
- Storage: `localhost:9199`
- Functions: `localhost:5001`
- Emulator UI: `localhost:4000`

## Firebase Best Practices Applied

1. **Environment Variable Separation**: Clear separation between frontend and backend variables
2. **Recommended Configuration Method**: Using direct configuration in function code instead of `.env` files for Cloud Functions
3. **Emulator Support**: Proper configuration for Firebase emulator suite
4. **No Reserved Variables**: Avoiding Firebase reserved environment variable names

## Troubleshooting

### Previous Issues Resolved
- **".env loading error"**: Resolved by removing backend `.env` files and setting region directly in function code
- **Environment variable conflicts**: Resolved by proper separation of frontend/backend variables
- **Emulator connectivity**: Ensured through proper `VITE_` prefixed variables

### Development Workflow
1. Use the VS Code task "Start Development Environment" to start all emulators
2. Frontend variables are automatically loaded by Vite from root `.env`
3. Backend region is set directly in function definitions
4. All emulators connect using the configured ports

## References
- [Firebase Cloud Functions Environment Configuration](https://firebase.google.com/docs/functions/config-env)
- [Firebase Emulator Suite Configuration](https://firebase.google.com/docs/emulator-suite/connect_functions)
- [Firebase Cloud Functions Locations](https://firebase.google.com/docs/functions/locations)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
