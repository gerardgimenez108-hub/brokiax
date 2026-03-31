import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const leadSchema = z.object({
  email: z.string().email('Invalid email address'),
  source: z.string().optional().default('landing_page')
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = leadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.format() },
        { status: 400 }
      );
    }

    const { email, source } = result.data;

    const db = getAdminDb();
    
    // Check if the lead already exists
    const existingLead = await db.collection('leads').where('email', '==', email).get();
    
    if (!existingLead.empty) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 200 }
      );
    }

    // Save lead to Firestore
    await db.collection('leads').add({
      email,
      source,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      tags: ['lead_magnet', 'prompt_guide']
    });

    // TODO: Integrate with Resend or Mailchimp to send the "Day 1" email here.
    // e.g. await resend.emails.send({ ... })

    return NextResponse.json(
      { message: 'Successfully subscribed' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
