import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin-init';
import { v4 as uuidv4 } from 'uuid';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb(); // Centralized Init
    
    const body = await request.json();
    const { uid, tier, tierName } = body; // Price argument is IGNORED for security

    if (!uid || !tier) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`Processing purchase for user ${uid}, tier: ${tier}`);

    // Fetch Security & Pricing Config
    const pricingRef = db.collection('config').doc('pricing');
    const pricingDoc = await pricingRef.get();
    
    let Config = {
      proplus_price: 1,
      ultimate_price: 2,
      discount_active: false,
      discount_percent: 0,
      discount_tiers: [] as string[]
    };

    if (pricingDoc.exists) {
      const data = pricingDoc.data();
      if (data) {
        Config = { ...Config, ...data };
      }
    }

    // Calculate Final Price Server-Side
    let basePrice = (tier === 'ultimate') ? Config.ultimate_price : Config.proplus_price;
    let finalPrice = basePrice;
    let discountApplied = false;

    if (Config.discount_active && Config.discount_tiers.includes(tier)) {
      const discountAmount = basePrice * (Config.discount_percent / 100);
      finalPrice = Math.max(0, basePrice - discountAmount); // Prevent negative price
      discountApplied = true;
    }

    console.log(`Price Calculation: Base=${basePrice}, Discount=${discountApplied ? Config.discount_percent + '%' : 'None'}, Final=${finalPrice}`);

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
