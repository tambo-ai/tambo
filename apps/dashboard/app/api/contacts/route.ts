import { env } from "@/lib/env";
import { getDb, schema } from "@tambo-ai-cloud/db";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod/v3";

// Validation schema for contact submission
const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  title: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: result.error.format(),
        },
        { status: 400 },
      );
    }

    const { firstName, lastName, email, title } = result.data;

    // Get database connection
    const db = getDb(env.DATABASE_URL);

    // Check if contact with this email already exists
    const existingContact = await db
      .select()
      .from(schema.contacts)
      .where(eq(schema.contacts.email, email))
      .limit(1);

    // Build the initial metadata
    const metadata: Record<string, unknown> = {
      title,
      event: "seattle_startup_summit_2025", // change event name between events
    };

    // Store the audience ID in metadata
    metadata.resendAudienceId = env.RESEND_AUDIENCE_ID;

    let resendContactId: string | undefined;
    if (env.RESEND_API_KEY && env.RESEND_AUDIENCE_ID) {
      try {
        const resend = new Resend(env.RESEND_API_KEY);
        // Create or update contact but do not override unsubscribe
        const upsert = await resend.contacts.create({
          audienceId: env.RESEND_AUDIENCE_ID,
          email,
          firstName,
          ...(lastName && { lastName }),
        });
        if (upsert.error) {
          console.error("Resend API error:", upsert.error);
        } else if (upsert.data?.id) {
          resendContactId = upsert.data.id;
          metadata.resendContactId = resendContactId;
          console.log(`Added to Resend audience with ID: ${resendContactId}`);
        }
      } catch (resendError) {
        console.error("Error adding to Resend audience:", resendError);
        // We'll continue even if Resend integration fails
      }
    }

    let contact;
    let message: string;

    if (existingContact.length > 0) {
      // Update existing contact
      const updatedContact = await db
        .update(schema.contacts)
        .set({
          firstName,
          ...(lastName && { lastName }),
          // Merge the existing metadata with our new metadata
          metadata: {
            ...existingContact[0].metadata,
            ...metadata,
          },
          updatedAt: sql`now()`,
        })
        .where(eq(schema.contacts.email, email))
        .returning();

      contact = updatedContact[0];
      message = `Updated info for ${email}`;
      console.log(`Updated existing contact: ${email}`);
    } else {
      // Insert new contact
      const newContact = await db
        .insert(schema.contacts)
        .values({
          firstName,
          ...(lastName && { lastName }),
          email,
          metadata,
        })
        .returning();

      contact = newContact[0];
      message = `Added you to our email list`;
      console.log(`Created new contact: ${email}`);
    }

    return NextResponse.json({
      success: true,
      data: contact,
      message,
    });
  } catch (error) {
    console.error("Error handling contact submission:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}
