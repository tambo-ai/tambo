import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, post } = body;

    // Validate required fields
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate post data if provided
    if (post) {
      if (!post.title || typeof post.title !== "string" || !post.title.trim()) {
        return NextResponse.json(
          { error: "Post title is required" },
          { status: 400 },
        );
      }
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Create the user and post in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          email: email.trim(),
          name: name && name.trim() ? name.trim() : null,
        },
      });

      // Create the post if post data is provided
      let createdPost = null;
      if (post) {
        createdPost = await tx.post.create({
          data: {
            title: post.title.trim(),
            content:
              post.content && post.content.trim() ? post.content.trim() : null,
            published: post.published === true,
            authorId: user.id,
          },
        });
      }

      return { user, post: createdPost };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);

    // Handle Prisma unique constraint errors
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
