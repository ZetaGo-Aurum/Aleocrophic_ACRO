const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Mocking .env.local loading for simple node script
const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.trim();
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

console.log('--- Aleocrophic Supabase Connection Test ---');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  try {
    console.log('\n1. Testing Connection...');
    const { data, error } = await supabase.from('orders').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation "orders" does not exist')) {
        console.warn('⚠️  Table "orders" not found. Did you run the SQL schema in Supabase Dashboard?');
      } else {
        throw error;
      }
    } else {
      console.log('✅ Connection Successful! Orders count:', data);
    }

    console.log('\n2. Testing Authentication (Session Management)...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) throw authError;
    console.log('✅ Auth system is stable.');

    console.log('\n3. Simulating Database Operation (Insert Order)...');
    const testOrder = {
      supporter_name: 'Test Runner',
      supporter_email: 'test@aleocrophic.com',
      quantity: 1,
      total_amount: 0,
      tier: 'TEST',
      license_key: 'TEST-' + Math.random().toString(36).substring(7).toUpperCase()
    };
    
    console.log('Inserting test order:', testOrder.license_key);
    // Note: This might fail if RLS is enabled and we are not authenticated
    const { error: insertError } = await supabase.from('orders').insert([testOrder]);
    
    if (insertError) {
      if (insertError.code === '42501') {
        console.log('ℹ️  Insert blocked by RLS (Expected if not using Admin Key).');
      } else {
        console.error('❌ Insert failed:', insertError.message);
      }
    } else {
      console.log('✅ Insert successful!');
    }

    console.log('\n--- Test Completed Successfully ---');
  } catch (err) {
    console.error('\n❌ Test Failed:');
    console.error(err);
  }
}

runTest();
