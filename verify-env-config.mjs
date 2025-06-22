// Verify environment configuration script
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env.development
const envFile = join(__dirname, '.env.development');
const envContent = readFileSync(envFile, 'utf8');

console.log('🔧 Environment Configuration Check');
console.log('=====================================');

// Parse .env file
const envVars = {};
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  }
});

const requiredVars = [
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_REGION',
  'VITE_EMULATOR_AUTH_PORT',
  'VITE_EMULATOR_FIRESTORE_PORT',
  'VITE_EMULATOR_FUNCTIONS_PORT',
  'VITE_USE_EMULATORS'
];

let allGood = true;

requiredVars.forEach(varName => {
  const value = envVars[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allGood = false;
  }
});

console.log('=====================================');
if (allGood) {
  console.log('✅ All required environment variables are set');
} else {
  console.log('❌ Some environment variables are missing');
  process.exit(1);
}

// Test Firebase config construction
const firebaseConfig = {
  projectId: envVars.VITE_FIREBASE_PROJECT_ID || "rajarshi-mess",
  region: envVars.VITE_FIREBASE_REGION || "us-central1"
};

console.log('\n🔥 Firebase Configuration:');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Region:', firebaseConfig.region);
console.log('Emulators Enabled:', envVars.VITE_USE_EMULATORS === 'true');

console.log('\n🔧 Emulator Endpoints:');
console.log('Auth:', `http://localhost:${envVars.VITE_EMULATOR_AUTH_PORT}`);
console.log('Firestore:', `http://localhost:${envVars.VITE_EMULATOR_FIRESTORE_PORT}`);
console.log('Functions:', `http://localhost:${envVars.VITE_EMULATOR_FUNCTIONS_PORT}`);
console.log('Storage:', `http://localhost:${envVars.VITE_EMULATOR_STORAGE_PORT}`);
console.log('UI:', `http://localhost:${envVars.VITE_EMULATOR_UI_PORT}`);
