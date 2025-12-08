import { z } from "zod/v3";

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

// DNS over HTTPS for cross-platform MX record checking
async function checkMxRecords(domain: string): Promise<boolean> {
  try {
    // Convert IDN domains to punycode using the URL constructor
    // This handles internationalized domain names properly
    let punycodeAsciiDomain: string;
    try {
      // Create a temporary URL to get the punycode version of the domain
      const tempUrl = new URL(`https://${domain}`);
      punycodeAsciiDomain = tempUrl.hostname;
    } catch (error) {
      // If URL construction fails, the domain is likely invalid
      console.warn(`Invalid domain format: ${domain}`, error);
      return false;
    }

    // Use Cloudflare's DNS over HTTPS service with the punycode domain
    const response = await fetch(
      `https://one.one.one.one/dns-query?name=${encodeURIComponent(punycodeAsciiDomain)}&type=MX`,
      {
        headers: {
          Accept: "application/dns-json",
        },
      },
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    // Check if there are any MX records
    return data.Answer && data.Answer.length > 0;
  } catch (error) {
    // If the DNS lookup fails, we'll assume the domain is invalid
    console.warn(`MX record lookup failed for ${domain}:`, error);
    return false;
  }
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
  const atIndex = email.lastIndexOf("@");
  const domain =
    atIndex > -1 ? email.slice(atIndex + 1).toLowerCase() : undefined;
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

  // MX record validation using DNS over HTTPS
  if (validateMx) {
    const hasMxRecords = await checkMxRecords(domain);
    if (!hasMxRecords) {
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
