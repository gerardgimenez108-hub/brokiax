import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { Resend } from 'resend';

const leadSchema = z.object({
  email: z.string().email('Invalid email address'),
  source: z.string().optional().default('landing_page')
});

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://brokiax.web.app';

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

    // Send the Lead Magnet email via Resend
    try {
      await resend.emails.send({
        from: 'Brokiax <onboarding@resend.dev>',
        to: [email],
        subject: '🚀 Tu Guía de Trading con IA — Brokiax',
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0a2e; color: #e0e7ff; padding: 40px; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 28px; color: #ffffff; margin: 0;">BROKIAX</h1>
              <p style="color: #a5b4fc; font-size: 12px; letter-spacing: 3px; margin-top: 4px;">AI TRADING ECOSYSTEM</p>
            </div>
            
            <h2 style="color: #ffffff; font-size: 22px; text-align: center; margin-bottom: 8px;">
              ¡Tu Guía Definitiva está lista!
            </h2>
            <p style="color: #c7d2fe; text-align: center; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
              Gracias por unirte a la comunidad Brokiax. Hemos preparado un recurso exclusivo con estrategias de trading algorítmico, prompts institucionales y configuración de DEX Wallets.
            </p>
            
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${APP_URL}/Guia_Brokiax.pdf" style="display: inline-block; background: #6366f1; color: #ffffff; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 20px rgba(99,102,241,0.4);">
                📥 Descargar Guía PDF
              </a>
            </div>
            
            <div style="background: #1e1b4b; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="color: #a5b4fc; font-size: 13px; font-weight: bold; margin: 0 0 8px 0;">Dentro de la guía encontrarás:</p>
              <p style="color: #c7d2fe; font-size: 13px; line-height: 1.8; margin: 0;">
                ✅ Los 5 Prompts Institucionales más rentables<br/>
                ✅ Configuración completa del Strategy Studio<br/>
                ✅ Guía de DEX Trading sin APIs (Hyperliquid)<br/>
                ✅ Gestión de riesgo profesional<br/>
                ✅ Checklist completo del trader algorítmico
              </p>
            </div>
            
            <div style="text-align: center; margin-bottom: 24px;">
              <p style="color: #c7d2fe; font-size: 14px; margin-bottom: 12px;">¿Listo para empezar a operar?</p>
              <a href="${APP_URL}/register" style="display: inline-block; background: transparent; color: #a5b4fc; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px; border: 1px solid #6366f1;">
                Crear Cuenta Gratuita →
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #312e81; margin: 24px 0;" />
            <p style="color: #64748b; font-size: 11px; text-align: center; line-height: 1.6;">
              Has recibido este email porque te suscribiste en brokiax.web.app.<br/>
              Si no fuiste tú, puedes ignorar este mensaje.<br/>
              © 2026 Brokiax — AI Trading Ecosystem
            </p>
          </div>
        `,
      });
      console.log(`✅ [RESEND] Lead magnet email sent to ${email}`);
    } catch (emailError) {
      // Log but don't fail the request if email sending fails
      console.error('⚠️ [RESEND] Failed to send email:', emailError);
    }

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
