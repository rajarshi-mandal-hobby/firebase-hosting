// Test users creation script for environment verification
import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
const authPort = env.VITE_EMULATOR_AUTH_PORT || '9099';
const firestorePort = env.VITE_EMULATOR_FIRESTORE_PORT || '8080';

try {
  connectAuthEmulator(auth, `http://localhost:${authPort}`);
  connectFirestoreEmulator(db, 'localhost', parseInt(firestorePort));
} catch (error) {
  console.log('Emulators already connected or connection failed:', error.message);
}

// Test users data
const testUsers = [
  {
    email: 'admin@rajarshimess.com',
    password: 'admin123',
    role: 'admin',
    displayName: 'Admin User'
  },
  {
    email: 'user1@rajarshimess.com', 
    password: 'user123',
    role: 'user',
    displayName: 'Test User 1'
  },
  {
    email: 'user2@rajarshimess.com',
    password: 'user123', 
    role: 'user',
    displayName: 'Test User 2'
  }
];

async function clearExistingUsers() {
  try {
    console.log('🧹 Clearing existing test users...');
    // Note: In emulator, we can't directly delete users from Admin SDK in client
    // Users will be cleared when emulator restarts
    console.log('✅ Users will be cleared on emulator restart');
  } catch (error) {
    console.log('⚠️  Error clearing users:', error.message);
  }
}

async function createTestUsers() {
  console.log('👥 Creating test users with environment configuration...');  console.log(`🔥 Using Project ID: ${env.VITE_FIREBASE_PROJECT_ID}`);
  console.log(`🌏 Using Region: ${env.VITE_FIREBASE_REGION}`);
  console.log(`🔒 Auth Emulator: http://localhost:${authPort}`);
  console.log(`📊 Firestore Emulator: http://localhost:${firestorePort}`);
  console.log('');

  for (const user of testUsers) {
    try {
      console.log(`Creating user: ${user.email} (${user.role})`);
      
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      const uid = userCredential.user.uid;
      
      // Add user role to Firestore
      await addDoc(collection(db, 'users'), {
        uid: uid,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        createdAt: new Date().toISOString(),
        isActive: true
      });
      
      console.log(`✅ Created: ${user.email} (UID: ${uid})`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  User already exists: ${user.email}`);
      } else {
        console.log(`❌ Error creating ${user.email}:`, error.message);
      }
    }
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing authentication...');
  
  for (const user of testUsers) {
    try {
      console.log(`Testing login: ${user.email}`);
      const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
      console.log(`✅ Login successful: ${user.email} (UID: ${userCredential.user.uid})`);
      
      // Sign out
      await auth.signOut();
      
    } catch (error) {
      console.log(`❌ Login failed for ${user.email}:`, error.message);
    }
  }
}

async function verifyUserData() {
  console.log('\n📊 Verifying user data in Firestore...');
  
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`📋 Found ${usersSnapshot.size} users in database:`);
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log(`  - ${userData.email} (${userData.role}) - UID: ${userData.uid}`);
    });
    
  } catch (error) {
    console.log('❌ Error reading user data:', error.message);
  }
}

async function runTests() {
  try {
    await clearExistingUsers();
    await createTestUsers();
    await testAuthentication();
    await verifyUserData();
    
    console.log('\n🎉 User testing complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Open browser: http://localhost:5173');
    console.log('2. Test sign-in with any of the created users');
    console.log('3. Check Firebase Emulator UI: http://localhost:4000');
    console.log('\n👥 Test Users:');
    testUsers.forEach(user => {
      console.log(`   ${user.email} / ${user.password} (${user.role})`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTests();
