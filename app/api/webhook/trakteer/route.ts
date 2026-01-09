import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin-init';
import { FieldValue } from 'firebase-admin/firestore';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

interface TrakteerWebhookPayload {
  id: string;
  supporter_name: string;
  supporter_email: string;
  supporter_message: string;
  unit: string;
  quantity: number;
  price: number;
  created_at: string;
  order_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb(); // Centralized Init
    
    const payload: TrakteerWebhookPayload = await request.json();
    
    console.log('=== TRAKTEER WEBHOOK RECEIVED ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    // Extract data from payload - Check multiple possible field names
    const acronCount = payload.quantity || 1;
    const supporterName = payload.supporter_name || 'Anonymous';
    
    // Trakteer may send email in different fields depending on API version
    // Cast through 'unknown' to access dynamic fields safely
    const rawPayload = payload as unknown as Record<string, any>;
    const supporterEmail = (
      payload.supporter_email || 
      rawPayload.email ||
      rawPayload.supporter_info?.email ||
      rawPayload.unit_price?.supporter_email ||
      ''
    ).toString().toLowerCase().trim();
    
    const transactionId = payload.id || payload.order_id || `TRX-${Date.now()}`;
    
    console.log(`Processing: ${acronCount} ACRON for email: "${supporterEmail}" (name: ${supporterName})`);
    console.log('Raw payload fields:', Object.keys(payload));
    
    if (!supporterEmail) {
      console.log('⚠️ No email in payload - This might be a TEST webhook');
      console.log('Full payload for debugging:', JSON.stringify(payload, null, 2));
      
      // Return success for test webhooks - Trakteer test button doesn't include email
      return NextResponse.json({
        success: true,
        message: 'Webhook received (no email provided - test mode detected)',
        debug: {
          receivedFields: Object.keys(payload),
          supporterName,
          quantity: acronCount
        }
      });
    }
    
    // Initialize Firebase Admin (Already initialized)

    
    // Find user by email in Firestore
    const usersRef = db.collection('users');
    const querySnapshot = await usersRef.where('email', '==', supporterEmail).get();
    
    if (querySnapshot.empty) {
      console.log(`User not found with email: ${supporterEmail}`);
      // Still return success to Trakteer, but log the issue
      // User might need to sign up first
      return NextResponse.json({
        success: true,
        warning: 'User not found - ACRON will be credited when they sign up with this email',
        email: supporterEmail,
        acronCount
      });
    }
    
    // Get the user document
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;
    
    console.log(`Found user: ${userId}, current balance: ${userData.acronBalance || 0}`);
    
    // Update user's ACRON balance
    const newBalance = (userData.acronBalance || 0) + acronCount;
    
    // Create license if this is a purchase (check message for tier)
    // Updated thresholds: PRO+ = 25 ACRON, ULTIMATE = 50 ACRON
    const message = (payload.supporter_message || '').toLowerCase();
    let license = null;
    
    const PROPLUS_THRESHOLD = 25;
    const ULTIMATE_THRESHOLD = 50;
    
    if (message.includes('ultimate') || message.includes('ult')) {
      if (acronCount >= ULTIMATE_THRESHOLD) {
        license = {
          key: `ACRO-ULT-${uuidv4().substring(0, 8).toUpperCase()}`,
          tier: 'ultimate',
          tierName: 'ULTIMATE Edition',
          createdAt: new Date().toISOString(),
          isActive: true,
          transactionId
        };
      }
    } else if (message.includes('pro+') || message.includes('proplus') || message.includes('pro')) {
      if (acronCount >= PROPLUS_THRESHOLD) {
        license = {
          key: `ACRO-PP-${uuidv4().substring(0, 8).toUpperCase()}`,
          tier: 'proplus',
          tierName: 'PRO+ Edition',
          createdAt: new Date().toISOString(),
          isActive: true,
          transactionId
        };
      }
    }
    
    // Prepare update data
    const updateData: Record<string, unknown> = {
      acronBalance: newBalance,
      lastTopUp: new Date().toISOString(),
      lastTopUpAmount: acronCount,
      lastTransactionId: transactionId
    };
    
    // Add license if generated
    if (license) {
      updateData.licenses = FieldValue.arrayUnion(license);
    }
    
    // Update the user document
    await usersRef.doc(userId).update(updateData);
    
    // Also save license to licenses collection if generated
    if (license) {
      await db.collection('licenses').doc(license.key).set({
        ...license,
        userId: userId,
        userEmail: supporterEmail
      });
    }
    
    console.log(`✓ Updated user ${userId}: balance ${userData.acronBalance || 0} → ${newBalance}`);
    if (license) {
      console.log(`✓ Generated license: ${license.key} (${license.tierName})`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Added ${acronCount} ACRON to ${supporterName}'s account!`,
      newBalance,
      license: license ? {
        key: license.key,
        tier: license.tierName
      } : null,
      user: {
        id: userId,
        email: supporterEmail
      }
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET method for testing
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'ACRO Trakteer Webhook Endpoint',
    version: '2.0',
    info: 'Send POST request with Trakteer webhook payload'
  });
}
