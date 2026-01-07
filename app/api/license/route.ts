import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin-init';

export async function POST(request: NextRequest) {
  try {
    const { licenseKey } = await request.json();
    
    if (!licenseKey || typeof licenseKey !== 'string') {
      return NextResponse.json({
        valid: false,
        error: 'License key is required'
      }, { status: 400 });
    }
    
    console.log(`Verifying license: ${licenseKey}`);
    
    // Initialize Firebase Admin (Centralized)
    const db = getAdminDb();
    
    // Check license in "licenses" collection
    const licenseDoc = await db.collection('licenses').doc(licenseKey).get();
    
    if (!licenseDoc.exists) {
      console.log(`License not found: ${licenseKey}`);
      return NextResponse.json({
        valid: false,
        error: 'Invalid license key'
      }, { status: 404 });
    }
    
    const licenseData = licenseDoc.data();
    
    if (!licenseData?.isActive) {
      return NextResponse.json({
        valid: false,
        error: 'License is inactive or revoked'
      }, { status: 403 });
    }
    
    console.log(`✓ License valid: ${licenseKey} (${licenseData.tier})`);
    
    return NextResponse.json({
      valid: true,
      licenseType: licenseData.tier,
      tierName: licenseData.tierName,
      createdAt: licenseData.createdAt,
      message: 'License key is valid!'
    });
    
  } catch (error: any) {
    console.error('License verification error:', error);
    return NextResponse.json({
      valid: false,
      error: 'Failed to verify license',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'ACRO License Validation API',
    method: 'POST',
    body: { licenseKey: 'ACRO-XX-...' }
  });
}
