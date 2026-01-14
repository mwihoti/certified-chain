import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;


async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Check environment variables
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
    process.exit(1);
  }
  if (!supabaseKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is not set');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);

  // Create client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Check if we can reach Supabase
    console.log('\n📡 Testing connection...');
    
    const { data, error } = await supabase.from('_test_connection').select('*').limit(1);
    
    // This will likely error since the table doesn't exist, but that's fine
    // A 404 or "relation does not exist" error means we connected successfully
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        console.log('✅ Connection successful! (test table does not exist, which is expected)');
      } else if (error.message.includes('Invalid API key')) {
        console.error('❌ Invalid API key. Please check your SUPABASE_PUBLISHABLE_DEFAULT_KEY');
        process.exit(1);
      } else {
        console.log('✅ Connected to Supabase');
        console.log(`   Response: ${error.message}`);
      }
    } else {
      console.log('✅ Connection successful!');
    }

    // Test 2: Try to get auth session (won't have one, but tests the auth endpoint)
    console.log('\n🔐 Testing auth endpoint...');
    const { data: session, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
    } else {
      console.log('✅ Auth endpoint working');
      console.log(`   Session: ${session.session ? 'Active' : 'No active session (expected)'}`);
    }
{/*
    // Test 3: List tables (if you have any)
    console.log('\n📋 Checking database tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables')
      .catch(() => ({ data: null, error: { message: 'RPC not available' } }));

    if (tablesError || !tables) {
      // Alternative: try querying a known table
      const { error: orgError } = await supabase.from('organizations').select('count').limit(1);
      
      if (!orgError) {
        console.log('✅ Found "organizations" table');
      } else if (orgError.message.includes('does not exist')) {
        console.log('ℹ️  No "organizations" table found (may need to create tables)');
      } else {
        console.log('ℹ️  Could not list tables:', orgError.message);
      }
    }*/}

    console.log('\n✅ Supabase connection test complete!');

  } catch (err: any) {
    console.error('\n❌ Connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();