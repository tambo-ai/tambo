import { resolveMx } from "dns";
import { promisify } from "util";
import { z } from "zod";

const resolveMxAsync = promisify(resolveMx);

// Common disposable email domains - you can expand this list as needed
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "tempmail.org",
  "throwaway.email",
  "temp-mail.org",
  "sharklasers.com",
  "yopmail.com",
  "maildrop.cc",
  "trashmail.com",
  "dispostable.com",
  "fakeinbox.com",
  "spamgourmet.com",
  "jetable.org",
  "mytrashmail.com",
  // Add more as needed
]);

// Basic email schema using zod
const emailSchema = z.string().email();

export interface EmailValidationResult {
  valid: boolean;
  reason?: "format" | "mx" | "disposable";
  message?: string;
}

export interface EmailValidationOptions {
  validateMx?: boolean;
  validateDisposable?: boolean;
  // Removed validateSMTP and validateTypo as they're unreliable/not needed
}

export async function validateEmail(
  email: string,
  options: EmailValidationOptions = {},
): Promise<EmailValidationResult> {
  const { validateMx = true, validateDisposable = true } = options;

  // Basic format validation using zod
  const formatResult = emailSchema.safeParse(email);
  if (!formatResult.success) {
    return {
      valid: false,
      reason: "format",
      message: "Please enter a valid email address format.",
    };
  }

  // Extract domain from email
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) {
    return {
      valid: false,
      reason: "format",
      message: "Please enter a valid email address format.",
    };
  }

  // Check for disposable email domains
  if (validateDisposable && DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      reason: "disposable",
      message:
        "Please use your regular email address instead of a temporary one.",
    };
  }

  // MX record validation
  if (validateMx) {
    try {
      const mxRecords = await resolveMxAsync(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return {
          valid: false,
          reason: "mx",
          message:
            "The email domain appears to be invalid or cannot receive emails.",
        };
      }
    } catch (_error) {
      // DNS resolution failed
      return {
        valid: false,
        reason: "mx",
        message:
          "The email domain appears to be invalid or cannot receive emails.",
      };
    }
  }

  return { valid: true };
}
