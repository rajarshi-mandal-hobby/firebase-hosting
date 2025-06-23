import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

// Make test functions globally available in development
if (import.meta.env.DEV) {
  console.log(`
🚀 FIREBASE EMULATOR DEVELOPMENT MODE

⚠️  STRICT RULE: ALWAYS CHECK BEFORE STARTING!

🔍 REQUIRED WORKFLOW:
   1. Check emulator ports: netstat -an | findstr ":9099 :8080 :9199 :4000"
   2. If ports in use: ❌ DO NOT start emulators again
   3. If ports free: ✅ firebase emulators:start --only auth,firestore,storage,ui
   4. Check dev server: netstat -an | findstr ":5173"  
   5. If port 5173 in use: ❌ DO NOT run npm run dev again
   6. If port 5173 free: ✅ npm run dev

💡 Use PowerShell script: ./start-dev.ps1 (follows strict checking rule)

✅ Emulator URLs (verify they're accessible):
   - Auth: http://${import.meta.env["VITE_EMULATOR_AUTH_HOST"] || "localhost"}:${import.meta.env["VITE_EMULATOR_AUTH_PORT"] || "9099"}
   - Firestore: http://${import.meta.env["VITE_EMULATOR_FIRESTORE_HOST"] || "localhost"}:${import.meta.env["VITE_EMULATOR_FIRESTORE_PORT"] || "8080"}
   - Storage: http://${import.meta.env["VITE_EMULATOR_STORAGE_HOST"] || "localhost"}:${import.meta.env["VITE_EMULATOR_STORAGE_PORT"] || "9199"}
   - UI Dashboard: http://${import.meta.env["VITE_EMULATOR_AUTH_HOST"] || "localhost"}:${import.meta.env["VITE_EMULATOR_UI_PORT"] || "4000"}

📱 Test Functions Available:
   > window.createTestUsers()    // Populate test users
   > window.clearTestUsers()     // Clear all test users

👥 Test Accounts (password: password123):
   - rajarshhi@gmail.com (Admin)
   - admin@rajarshi-mess.com (Admin)  
   - user1@example.com (Regular User)
   - user2@example.com (Regular User)
   - user3@example.com (Regular User)
   - user4@example.com (Regular User)

📞 Phone Verification (Simplified for Dev):
   - Use any phone number
   - Use any 6-digit OTP code
   - No real SMS sent - completely simulated
  `);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
