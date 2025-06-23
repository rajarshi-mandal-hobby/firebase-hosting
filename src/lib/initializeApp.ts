// Initialize Firestore collections with default data
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

/**
 * Initialize the application with default configuration
 * This should be called once during app setup
 */
export const initializeApp = async (): Promise<void> => {
  try {
    console.log("🚀 Initializing application...");

    // Initialize config collection using cloud function
    const initializeConfigFunction = httpsCallable(
      functions,
      "initializeConfiguration",
    );
    const result = await initializeConfigFunction({});

    if (
      result.data &&
      typeof result.data === "object" &&
      "success" in result.data
    ) {
      const response = result.data as {
        success: boolean;
        message: string;
        isNew?: boolean;
      };
      if (response.success) {
        console.log(`✅ ${response.message}`);
        if (response.isNew) {
          console.log("🆕 New configuration created");
        } else {
          console.log("ℹ️ Configuration already exists");
        }
      } else {
        console.warn(
          `⚠️ Configuration initialization failed: ${response.message}`,
        );
      }
    }

    console.log("✅ Application initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing application:", error);
    // Don't throw the error to prevent app from crashing
    // Configuration can be initialized manually from admin panel if needed
    console.log(
      "ℹ️ App will continue - configuration can be initialized from admin panel",
    );
  }
};

// Auto-initialize in development mode
if (import.meta.env.DEV) {
  initializeApp().catch((error) => {
    console.error("Failed to auto-initialize app:", error);
    console.log("ℹ️ Manual initialization may be required from admin panel");
  });
}
