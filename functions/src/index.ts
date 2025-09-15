/**
 * Firebase Cloud Functions - Main Entry Point
 * 
 * This file exports all the HTTP callable functions for the rent management system.
 * Functions are organized by domain: config, members, billing, and auth.
 */

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { setGlobalOptions } from "firebase-functions/v2/options";

// Initialize Firebase Admin
const app = initializeApp();

export const db = getFirestore(app);

// Set global options for all functions
setGlobalOptions({
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: "256MiB",
});

// Export all function modules
export * from "./config-operations";
export * from "./member-operations";
export * from "./billing-operations";
