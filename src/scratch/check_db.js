const DEFAULT_SUPABASE_URL = "https://glsjmryzxsunpritarpy.supabase.co/rest/v1";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsc2ptcnl6eHN1bnByaXRhcnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMDI3NjQsImV4cCI6MjA5ODY3ODc2NH0.huLwcIl1nd0u3RilKuWvA6X3HHpzr6BumImzze3q0XE";

async function test() {
  // Check drivers
  const drvResponse = await fetch(`${DEFAULT_SUPABASE_URL}/drivers?select=*`, {
    headers: {
      "apikey": DEFAULT_SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${DEFAULT_SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json"
    }
  });
  const drivers = await drvResponse.json();
  console.log('Total drivers in database:', drivers.length);
  if (Array.isArray(drivers) && drivers.length > 0) {
    console.log('Sample driver:', JSON.stringify(drivers[0]));
  } else {
    console.log('Drivers response:', JSON.stringify(drivers));
  }

  // Check drives
  const response = await fetch(`${DEFAULT_SUPABASE_URL}/drives?select=*`, {
    headers: {
      "apikey": DEFAULT_SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${DEFAULT_SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json"
    }
  });
  const drives = await response.json();
  console.log('Total drives in database:', drives.length);
  if (Array.isArray(drives) && drives.length > 0) {
    console.log('Sample drive:', JSON.stringify(drives[0]));
  } else {
    console.log('Drives response:', JSON.stringify(drives));
  }
}
test();
