import type { UPIPaymentParams, UPIPaymentData, GlobalSettings } from '../../../shared/types/firestore-types';

/**
 * UPI app detection result
 */
export interface UPIAppDetection {
  hasUPIApps: boolean;
  supportedApps: string[];
  canOpenUPI: boolean;
}

/**
 * Payment instruction data
 */
export interface PaymentInstructions {
  message: string;
  screenshotRequired: boolean;
  adminContact: string;
}

/**
 * UPI payment generation result
 */
export interface UPIPaymentResult {
  success: boolean;
  upiUri?: string;
  instructions: PaymentInstructions;
  error?: string;
}

/**
 * PaymentService for UPI integration
 * Handles UPI URI generation, app detection, and payment instructions
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */
export class PaymentService {
  /**
   * Generate UPI payment URI with configurable settings from Firestore
   * Requirements: 4.1, 4.2, 4.5, 4.6
   */
  static generateUPIUri(paymentData: UPIPaymentData, globalSettings: GlobalSettings): string {
    // Use configurable UPI VPA from global settings (requirement 4.5)
    const upiVpa = globalSettings.upiVpa;

    // Use configurable payee name from global settings instead of hardcoded "Rajarshi" (requirement 4.6)
    // Extract name from UPI VPA or use a default
    const payeeName = this.extractPayeeNameFromVPA(upiVpa) || 'Rent Payment';

    const upiParams: UPIPaymentParams = {
      pa: upiVpa, // UPI ID from global settings
      pn: payeeName, // Configurable payee name
      am: paymentData.amount, // Exact amount (requirement 4.2)
      cu: 'INR', // Currency
      tn: `Rent ${paymentData.billingMonth} - ${paymentData.memberName}`, // Transaction note with member name and billing month (requirement 4.2)
    };

    // Generate UPI URI following UPI specification
    const params = new URLSearchParams({
      pa: upiParams.pa,
      pn: upiParams.pn,
      am: upiParams.am.toString(),
      cu: upiParams.cu,
      tn: upiParams.tn,
    });

    return `upi://pay?${params.toString()}`;
  }

  /**
   * Extract payee name from UPI VPA
   * Attempts to extract a meaningful name from the UPI VPA format
   */
  private static extractPayeeNameFromVPA(upiVpa: string): string | null {
    // If UPI VPA contains a phone number, extract it
    const phoneMatch = upiVpa.match(/(\+?\d{10,})/);
    if (phoneMatch) {
      return 'Rent Payment';
    }

    // If UPI VPA has a username part, use it
    const usernamePart = upiVpa.split('@')[0];
    if (usernamePart && usernamePart !== upiVpa) {
      // Convert to readable format (e.g., "john.doe" -> "John Doe")
      return usernamePart
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }

    return null;
  }

  /**
   * Detect available UPI apps on the device
   * Requirements: 4.3, 4.8
   */
  static detectUPIApps(): UPIAppDetection {
    // In a real implementation, we would check if UPI apps are installed
    // For now, we'll assume UPI is available on mobile devices
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    // UPI is primarily supported on mobile devices
    const hasUPIApps = isMobile;
    const canOpenUPI = hasUPIApps;

    // Return detected apps based on platform
    let supportedApps: string[] = [];
    if (isAndroid) {
      supportedApps = ['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay'];
    } else if (isIOS) {
      supportedApps = ['Google Pay', 'PhonePe', 'Paytm', 'BHIM'];
    }

    return {
      hasUPIApps,
      supportedApps,
      canOpenUPI,
    };
  }

  /**
   * Generate payment instructions with screenshot requirements
   * Requirements: 4.4, 4.7
   */
  static generatePaymentInstructions(globalSettings: GlobalSettings): PaymentInstructions {
    // Extract admin contact from UPI VPA or use default
    const adminContact = this.extractContactFromVPA(globalSettings.upiVpa) || 'admin';

    return {
      message: `After completing the UPI payment, please send a screenshot to ${adminContact} for confirmation.`,
      screenshotRequired: true,
      adminContact,
    };
  }

  /**
   * Extract contact information from UPI VPA
   */
  private static extractContactFromVPA(upiVpa: string): string | null {
    // If UPI VPA contains a phone number, extract it
    const phoneMatch = upiVpa.match(/(\+?\d{10,})/);
    if (phoneMatch) {
      return phoneMatch[1];
    }

    // If UPI VPA has a username part, use it
    const usernamePart = upiVpa.split('@')[0];
    if (usernamePart && usernamePart !== upiVpa) {
      return usernamePart;
    }

    return null;
  }

  /**
   * Initiate UPI payment with proper error handling
   * Requirements: 4.3, 4.8
   */
  static async initiateUPIPayment(
    paymentData: UPIPaymentData,
    globalSettings: GlobalSettings
  ): Promise<UPIPaymentResult> {
    try {
      // Check if member has zero balance (requirement 4.7)
      if (paymentData.amount <= 0) {
        return {
          success: false,
          instructions: this.generatePaymentInstructions(globalSettings),
          error: 'No payment required - balance is zero or negative',
        };
      }

      // Detect UPI app availability
      const upiDetection = this.detectUPIApps();

      // Generate UPI URI
      const upiUri = this.generateUPIUri(paymentData, globalSettings);

      // Generate payment instructions
      const instructions = this.generatePaymentInstructions(globalSettings);

      // If UPI apps are not available, return helpful message (requirement 4.8)
      if (!upiDetection.canOpenUPI) {
        return {
          success: false,
          upiUri,
          instructions: {
            ...instructions,
            message: `UPI apps are not available on this device. Please use alternative payment methods or contact ${instructions.adminContact} for assistance.`,
          },
          error: 'UPI apps not available on this device',
        };
      }

      // Attempt to open UPI app (requirement 4.3)
      try {
        // Create a temporary link element to trigger UPI app opening
        const link = document.createElement('a');
        link.href = upiUri;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return {
          success: true,
          upiUri,
          instructions,
        };
      } catch (openError) {
        // If opening UPI app fails, still return success with instructions
        console.warn('Failed to open UPI app automatically:', openError);
        return {
          success: true,
          upiUri,
          instructions: {
            ...instructions,
            message: `Please copy the UPI ID (${globalSettings.upiVpa}) and make the payment manually. ${instructions.message}`,
          },
        };
      }
    } catch (error) {
      console.error('UPI payment initiation failed:', error);
      return {
        success: false,
        instructions: this.generatePaymentInstructions(globalSettings),
        error: error instanceof Error ? error.message : 'Failed to initiate UPI payment',
      };
    }
  }

  /**
   * Get UPI payment tooltip text
   * Requirements: 4.4, 4.8
   */
  static getUPITooltipText(globalSettings: GlobalSettings): string {
    const instructions = this.generatePaymentInstructions(globalSettings);
    const upiDetection = this.detectUPIApps();

    if (!upiDetection.canOpenUPI) {
      return `UPI payment not available on this device. Please contact ${instructions.adminContact} for alternative payment methods.`;
    }

    return `Click to pay via UPI. ${instructions.message}`;
  }

  /**
   * Validate UPI payment data
   */
  static validatePaymentData(paymentData: UPIPaymentData): { valid: boolean; error?: string } {
    if (!paymentData.memberName.trim()) {
      return { valid: false, error: 'Member name is required' };
    }

    if (paymentData.amount < 0) {
      return { valid: false, error: 'Payment amount cannot be negative' };
    }

    if (!paymentData.billingMonth.match(/^\d{4}-\d{2}$/)) {
      return { valid: false, error: 'Invalid billing month format (expected YYYY-MM)' };
    }

    if (!paymentData.upiPhoneNumber.trim()) {
      return { valid: false, error: 'UPI phone number is required' };
    }

    return { valid: true };
  }

  /**
   * Format billing month for display
   */
  static formatBillingMonth(billingMonth: string): string {
    try {
      const [year, month] = billingMonth.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });
    } catch {
      return billingMonth;
    }
  }
}
