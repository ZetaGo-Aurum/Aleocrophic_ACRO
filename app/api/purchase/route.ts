import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase Admin (reuse logic)
let adminApp: App;

function getAdminApp() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : null;
    
    if (serviceAccount) {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: 'server-media-75fdc'
      });
    } else {
      adminApp = initializeApp({
        projectId: 'server-media-75fdc'
      });
    }
  }
  return getApps()[0];
}

export async function POST(request: NextRequest) {
  try {
    const { uid, tier, tierName, price } = await request.json();

    if (!uid || !tier || !price) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`Processing purchase for user ${uid}: ${tier} (${price} ACRON)`);

    // Initialize Firebase Admin
    const app = getAdminApp();
    const db = getFirestore(app);
    const userRef = db.collection('users').doc(uid);

    // Run transaction to ensure atomic balance deduction
    const result = await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const currentBalance = userData?.acronBalance || 0;

      if (currentBalance < price) {
        throw new Error('Insufficient balance');
      }

      // Generate License
      const licenseKey = tier === 'ultimate' 
        ? `ACRO-ULT-${uuidv4().substring(0, 8).toUpperCase()}`
        : `ACRO-PP-${uuidv4().substring(0, 8).toUpperCase()}`;

      const newLicense = {
        key: licenseKey,
        tier,
        tierName,
        createdAt: new Date().toISOString(),
        isActive: true,
        transactionId: `PUR-${Date.now()}`
      };

      // Update User Data
      const newBalance = currentBalance - price;

      t.update(userRef, {
        acronBalance: newBalance,
        licenses: FieldValue.arrayUnion(newLicense),
        lastPurchase: new Date().toISOString()
      });

      return { newBalance, license: newLicense };
    });

    console.log(`✓ Purchase successful for ${uid}. New balance: ${result.newBalance}`);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('Purchase error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Transaction failed'
    }, { status: 400 }); // Return 400 for logic errors (like insufficient balance)
  }
}
