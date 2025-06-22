// Test Users for Firebase Auth Emulator
// Run this script to add test users to the emulator

import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Test user data
export const testUsers = [
  {
    email: 'rajarshhi@gmail.com',
    displayName: 'Rajarshi (Admin)',
    isAdmin: true,
    phoneVerified: true, // Admins skip phone verification
  },
  {
    email: 'admin@rajarshi-mess.com',
    displayName: 'Admin User',
    isAdmin: true,
    phoneVerified: true,
  },
  {
    email: 'user1@example.com',
    displayName: 'John Doe',
    isAdmin: false,
    phoneVerified: false,
    phoneNumber: '+91 9876543210',
  },
  {
    email: 'user2@example.com',
    displayName: 'Jane Smith',
    isAdmin: false,
    phoneVerified: false,
    phoneNumber: '+91 9876543211',
  },
  {
    email: 'user3@example.com',
    displayName: 'Mike Johnson',
    isAdmin: false,
    phoneVerified: false,
    phoneNumber: '+91 9876543212',
  },
  {
    email: 'user4@example.com',
    displayName: 'Sarah Wilson',
    isAdmin: false,
    phoneVerified: false,
    phoneNumber: '+91 9876543213',
  },
];

// Function to create test users in Firebase Auth Emulator using REST API
export const createTestUsersInAuth = async () => {
  console.log('🚀 Creating test users in Firebase Auth Emulator...');
  
  const API_KEY = import.meta.env['VITE_FIREBASE_API_KEY'] || 'demo-api-key';
  const AUTH_HOST = import.meta.env['VITE_EMULATOR_AUTH_HOST'] || 'localhost';
  const AUTH_PORT = import.meta.env['VITE_EMULATOR_AUTH_PORT'] || '9099';
  const AUTH_EMULATOR_URL = `http://${AUTH_HOST}:${AUTH_PORT}`;
  
  for (const userData of testUsers) {
    try {
      // Create user in Firebase Auth emulator using REST API
      const signUpResponse = await fetch(
        `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: userData.email,
            password: 'password123', // Default password for all test users
            displayName: userData.displayName,
            returnSecureToken: true
          })
        }
      );

      if (signUpResponse.ok) {
        const authData = await signUpResponse.json();
        console.log(`✅ Created auth user: ${userData.displayName} (${userData.email})`);
        
        // Create corresponding Firestore profile
        const userRef = doc(db, 'users', authData.localId);
        await setDoc(userRef, {
          email: userData.email,
          displayName: userData.displayName,
          isAdmin: userData.isAdmin,
          phoneVerified: userData.phoneVerified,
          phoneNumber: userData.phoneNumber || null,
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${userData.displayName}`,
          createdAt: new Date(),
        });
        
        console.log(`✅ Created Firestore profile for: ${userData.displayName}`);
      } else {
        const errorData = await signUpResponse.json();
        if (errorData.error?.message === 'EMAIL_EXISTS') {
          console.log(`⚠️  User already exists: ${userData.email}`);
        } else {
          console.error(`❌ Error creating auth user ${userData.email}:`, errorData);
        }
      }
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
    }
  }
  
  console.log('🎉 Test user creation completed!');
};

// Function to clear all test users from Auth emulator
export const clearTestUsers = async () => {
  console.log('🧹 Clearing all users from Firebase Auth Emulator...');
  
  const AUTH_HOST = import.meta.env['VITE_EMULATOR_AUTH_HOST'] || 'localhost';
  const AUTH_PORT = import.meta.env['VITE_EMULATOR_AUTH_PORT'] || '9099';
  const PROJECT_ID = import.meta.env['VITE_FIREBASE_PROJECT_ID'] || 'rajarshi-mess';
  
  try {
    const response = await fetch(
      `http://${AUTH_HOST}:${AUTH_PORT}/emulator/v1/projects/${PROJECT_ID}/accounts`,
      {
        method: 'DELETE'
      }
    );
    
    if (response.ok) {
      console.log('✅ All test users cleared from Auth emulator');
    } else {
      console.error('❌ Error clearing users:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error clearing users:', error);
  }
};

// Function to check if emulators are running
export const checkEmulatorsStatus = async () => {
  const AUTH_HOST = import.meta.env['VITE_EMULATOR_AUTH_HOST'] || 'localhost';
  const AUTH_PORT = import.meta.env['VITE_EMULATOR_AUTH_PORT'] || '9099';
  const FIRESTORE_HOST = import.meta.env['VITE_EMULATOR_FIRESTORE_HOST'] || 'localhost';
  const FIRESTORE_PORT = import.meta.env['VITE_EMULATOR_FIRESTORE_PORT'] || '8080';
  const STORAGE_HOST = import.meta.env['VITE_EMULATOR_STORAGE_HOST'] || 'localhost';
  const STORAGE_PORT = import.meta.env['VITE_EMULATOR_STORAGE_PORT'] || '9199';
  const FUNCTIONS_HOST = import.meta.env['VITE_EMULATOR_FUNCTIONS_HOST'] || 'localhost';
  const FUNCTIONS_PORT = import.meta.env['VITE_EMULATOR_FUNCTIONS_PORT'] || '5001';
  const UI_PORT = import.meta.env['VITE_EMULATOR_UI_PORT'] || '4000';
  
  const emulatorChecks = [
    { name: 'Auth', url: `http://${AUTH_HOST}:${AUTH_PORT}`, port: AUTH_PORT },
    { name: 'Firestore', url: `http://${FIRESTORE_HOST}:${FIRESTORE_PORT}`, port: FIRESTORE_PORT },
    { name: 'Storage', url: `http://${STORAGE_HOST}:${STORAGE_PORT}`, port: STORAGE_PORT },
    { name: 'Functions', url: `http://${FUNCTIONS_HOST}:${FUNCTIONS_PORT}`, port: FUNCTIONS_PORT },
    { name: 'Emulator UI', url: `http://${AUTH_HOST}:${UI_PORT}`, port: UI_PORT }
  ];

  console.log('🔍 Checking Firebase Emulator Status...');
  
  for (const emulator of emulatorChecks) {
    try {
      await fetch(emulator.url, { 
        method: 'GET',
        mode: 'no-cors' // Avoid CORS issues
      });
      console.log(`✅ ${emulator.name} emulator: Running (port ${emulator.port})`);
    } catch {
      console.log(`❌ ${emulator.name} emulator: Not running (port ${emulator.port})`);
    }  }
  
  console.log('\n💡 To start emulators: firebase emulators:start');
  console.log(`💡 Emulator UI: http://localhost:${import.meta.env['VITE_EMULATOR_UI_PORT'] || '4000'}`);
};

// Instructions for testing
export const testingInstructions = `
🧪 TESTING INSTRUCTIONS:

1. START EMULATORS:
   Run: npm run dev (this starts both Vite and Firebase emulators)

2. POPULATE TEST USERS:
   Open browser console and run: 
   window.createTestUsers()

3. ADMIN USERS (Direct Dashboard Access):
   Email: rajarshhi@gmail.com
   Email: admin@rajarshi-mess.com
   Password: password123

4. REGULAR USERS (Phone Verification Required):
   Email: user1@example.com (John Doe)
   Email: user2@example.com (Jane Smith) 
   Email: user3@example.com (Mike Johnson)
   Email: user4@example.com (Sarah Wilson)
   Password: password123

5. TESTING FLOW:
   a) Go to http://localhost:5173
   b) Click "Sign In as Admin" or "Sign In as User"
   c) Use Google Sign-In with any of the above emails
   d) Admin users → Go directly to dashboard
   e) Regular users → Redirected to phone verification
   f) For phone verification: Use any Indian phone number (+91...)
   g) OTP Code: Use any 6-digit code (emulator accepts all)

6. RESET USERS:
   Run in console: window.clearTestUsers()

7. EMULATOR UI:
   Auth: http://localhost:${import.meta.env['VITE_EMULATOR_UI_PORT'] || '4000'}
   Users visible in Authentication tab

8. NOTES:
   - All authentication happens in Firebase emulators
   - No real emails or SMS are sent
   - Users persist until emulator restart
   - Use browser dev tools console for user management functions
`;

console.log(testingInstructions);
