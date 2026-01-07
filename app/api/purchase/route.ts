import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin-init';
import { v4 as uuidv4 } from 'uuid';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb(); // Centralized Init (Throws clear error if env missing)
    
    const body = await request.json();
    const { uid, tier, tierName, price } = body;

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

      // Also create a standalone license document for easy validation
      const licenseRef = db.collection('licenses').doc(licenseKey);
      t.set(licenseRef, {
        ...newLicense,
        userId: uid,
        userEmail: userData?.email || 'unknown'
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
    
    // Determine status code based on error
    let status = 500;
    if (error.message === 'User not found' || error.message === 'Missing required fields') {
      status = 404;
    } else if (error.message === 'Insufficient balance') {
      status = 400; // Client side should handle this
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Transaction failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status });
  }
}
