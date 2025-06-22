// Check all Firestore collections and documents
import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, collection, getDocs, doc, getDoc } from 'firebase/firestore';

// Load environment variables manually
function loadEnv() {
  try {
    const envContent = readFileSync('.env.development', 'utf8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        env[key.trim()] = value.trim();
      }
    });
    
    return env;
  } catch (error) {
    console.log('Could not load .env.development file:', error.message);
    return {};
  }
}

const env = loadEnv();

// Firebase configuration
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to Firestore emulator
const firestorePort = env.VITE_EMULATOR_FIRESTORE_PORT || '8080';
try {
  connectFirestoreEmulator(db, 'localhost', parseInt(firestorePort));
} catch (error) {
  console.log('Emulator already connected:', error.message);
}

async function checkAllCollections() {
  console.log('🔍 Checking all Firestore collections...\n');
  
  // List of common collections to check
  const collectionsToCheck = ['users', 'students', 'config', 'settings', 'members'];
  
  for (const collectionName of collectionsToCheck) {
    try {
      console.log(`📋 Checking collection: ${collectionName}`);
      const querySnapshot = await getDocs(collection(db, collectionName));
      
      if (querySnapshot.empty) {
        console.log(`  ❌ Collection '${collectionName}' is empty or doesn't exist`);
      } else {
        console.log(`  ✅ Found ${querySnapshot.size} documents in '${collectionName}':`);
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`    - Document ID: ${doc.id}`);
          
          // Show key fields based on collection type
          if (collectionName === 'users') {
            console.log(`      Email: ${data.email || 'N/A'}, Role: ${data.role || 'N/A'}`);
          } else if (collectionName === 'students') {
            console.log(`      Name: ${data.name || 'N/A'}, Active: ${data.isActive || 'N/A'}`);
          } else {
            // Show first few fields for other collections
            const keys = Object.keys(data).slice(0, 3);
            keys.forEach(key => {
              console.log(`      ${key}: ${data[key]}`);
            });
          }
        });
      }
      console.log('');
    } catch (error) {
      console.log(`  ❌ Error checking '${collectionName}':`, error.message);
    }
  }
}

async function checkGlobalConfig() {
  console.log('⚙️ Checking global configuration...');
  try {
    const configDoc = await getDoc(doc(db, 'config', 'global'));
    if (configDoc.exists()) {
      console.log('✅ Global config found:', configDoc.data());
    } else {
      console.log('❌ No global config found');
    }
  } catch (error) {
    console.log('❌ Error checking config:', error.message);
  }
}

checkAllCollections().then(() => {
  checkGlobalConfig();
}).catch(console.error);
