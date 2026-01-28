import { Client, Databases, ID } from 'node-appwrite';
import { NextRequest, NextResponse } from 'next/server';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);
const DATABASE_ID = 'main';
const NOTES_COLLECTION_ID = 'notes';

export async function GET() {
  try {
    const response = await databases.listDocuments(DATABASE_ID, NOTES_COLLECTION_ID);
    return NextResponse.json(response.documents);
  } catch (error: any) {
    console.error('Appwrite error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch notes', 
      details: error.message || error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json();
    const note = await databases.createDocument(
      DATABASE_ID,
      NOTES_COLLECTION_ID,
      ID.unique(),
      { title }
    );
    return NextResponse.json(note);
  } catch (error: any) {
    console.error('Appwrite error:', error);
    return NextResponse.json({ 
      error: 'Failed to create note', 
      details: error.message || error 
    }, { status: 500 });
  }
}
