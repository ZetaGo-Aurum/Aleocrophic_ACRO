import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase Admin
let adminApp: App;

function getAdminApp() {
  if (getApps().length === 0) {
    // For Vercel deployment, use service account from environment variable
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : null;
    
    if (serviceAccount) {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: 'server-media-75fdc'
      });
    } else {
      // Fallback for development - use default credentials
      adminApp = initializeApp({
        projectId: 'server-media-75fdc'
      });
    }
  }
  return getApps()[0];
}

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
    const payload: TrakteerWebhookPayload = await request.json();
    
    console.log('=== TRAKTEER WEBHOOK RECEIVED ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    // Extract data from payload
    const acronCount = payload.quantity || 1;
    const supporterName = payload.supporter_name || 'Anonymous';
    const supporterEmail = (payload.supporter_email || '').toLowerCase().trim();
    const transactionId = payload.id || payload.order_id || `TRX-${Date.now()}`;
    
    console.log(`Processing: ${acronCount} ACRON for ${supporterEmail}`);
    
    if (!supporterEmail) {
      console.error('No supporter email provided');
      return NextResponse.json({
        success: false,
        error: 'No email provided in webhook'
      }, { status: 400 });
    }
    
    // Initialize Firebase Admin
    const app = getAdminApp();
    const db = getFirestore(app);
    
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
    const message = (payload.supporter_message || '').toLowerCase();
    let license = null;
    
    if (message.includes('ultimate') || message.includes('ult')) {
      if (acronCount >= 2) {
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
      if (acronCount >= 1) {
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
