# Firebase Functions Configuration

## Environment Variables - IMPORTANT

❌ **DO NOT CREATE .env FILES IN THE functions/ DIRECTORY**

The Firebase Functions emulator has issues parsing .env files which causes:
```
!!  functions: Failed to load function definition from source: FirebaseError: Failed to load environment variables from .env.
```

## Correct Configuration Method

✅ **Set region directly in function code** (current implementation):

```typescript
// Firebase Region Configuration
// Set region directly in function definitions as recommended by Firebase docs
const FIREBASE_REGION = 'asia-south1';
```

This approach:
- Follows Firebase best practices for Cloud Functions v2
- Avoids .env parsing issues
- Ensures reliable region configuration
- Works correctly with both emulator and deployment

## Files That Should NOT Exist
- `functions/.env`
- `functions/.env.local` 
- `functions/.env.dev`

These files are in `.gitignore` to prevent accidental creation.

## Reference
- [Firebase Cloud Functions Locations](https://firebase.google.com/docs/functions/locations)
- [Firebase Cloud Functions Environment Configuration](https://firebase.google.com/docs/functions/config-env)
