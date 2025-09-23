/**
 * Validation Utilities for Cloud Functions
 *
 * This file contains validation functions and error handling utilities
 * used across all Cloud Functions.
 */

import { https } from 'firebase-functions/v2';
import { CloudFunctionResponse } from '../types/shared';
import { z } from 'zod';




/**
 * Custom error class for function-specific errors
 */
export class ValidationError extends Error {
  constructor(public code: string, message: string, public details?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates that a user is authenticated
 * TESTING MODE: Authentication bypassed for development
 */
export function validateAuth(context: https.CallableRequest): string {
  // TESTING: Bypass authentication - return mock UID that exists in test data
  return 'firebase-uid-1';

  // Original auth code (commented for testing)
  // if (!context.auth?.uid) {
  //   throw new ValidationError('unauthenticated', 'User must be authenticated');
  // }
  // return context.auth.uid;
}

/**
 * Validates that required fields are present in the request data
 */
export function validateRequiredFields(data: unknown, requiredFields: string[]): Record<string, unknown> {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('invalid-argument', 'Request data must be an object');
  }

  const dataObj = data as Record<string, unknown>;

  for (const field of requiredFields) {
    if (!(field in dataObj) || dataObj[field] === undefined || dataObj[field] === null) {
      throw new ValidationError('missing-required-field', `Missing required field: ${field}`);
    }
  }

  return dataObj;
}

/**
 * Validates phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+91[0-9]{10}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(message: string, data?: T): CloudFunctionResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(message: string, error?: string): CloudFunctionResponse {
  return {
    success: false,
    message,
    error,
  };
}

/**
 * Error handler wrapper for Cloud Functions
 */
export function handleFunctionError(error: unknown): CloudFunctionResponse {
  console.error('Function error:', error);

  if (error instanceof ValidationError) {
    return createErrorResponse(error.message, error.code);
  }

  if (error instanceof Error) {
    return createErrorResponse('Internal server error', error.message);
  }

  return createErrorResponse('Unknown error occurred', 'unknown-error');
}

/**
 * Validates that a string is a valid member ID format
 */
export function validateMemberId(memberId: string): boolean {
  // Member IDs should be non-empty strings
  return typeof memberId === 'string' && memberId.trim().length > 0;
}

/**
 * Validates pagination parameters
 */
export function validatePagination(
  limit?: number,
  startAfter?: string
): {
  validLimit: number;
  validStartAfter?: string;
} {
  const validLimit = Math.min(Math.max(limit ?? 20, 1), 100); // Between 1-100, default 20
  const validStartAfter = startAfter?.trim() ? startAfter.trim() : undefined;

  return { validLimit, validStartAfter };
}
