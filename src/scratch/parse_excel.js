import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the new split workbook
const wb = XLSX.readFile(join(__dirname, '..', '..', 'July Drives Split Stops Import.xlsx'));
if (!wb.Sheets['Server Import'] || !wb.Sheets['Drivers']) {
  console.log('Error: Server Import or Drivers sheets not found in the workbook.');
  process.exit(1);
}

const rawDrivers = XLSX.utils.sheet_to_json(wb.Sheets['Drivers'], { defval: '' });
const rawDrives = XLSX.utils.sheet_to_json(wb.Sheets['Server Import'], { defval: '' });

// Escape SQL strings
function esc(val) {
  if (val === null || val === undefined || val === '') return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

// Generate migration SQL
let sql = `-- =====================================================
-- Supabase Migration: Seeded Premier Driving Coordinator
-- Generated from: July Drives Split Stops Import.xlsx
-- =====================================================

-- 1. Create tables
-- =====================================================

CREATE TABLE IF NOT EXISTS drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  "user" TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  color TEXT DEFAULT '#3ea0ff',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'car',
  plate TEXT DEFAULT '',
  destination_1 TEXT DEFAULT '',
  destination_2 TEXT DEFAULT '',
  destination_3 TEXT DEFAULT '',
  destination_4 TEXT DEFAULT '',
  destination_5 TEXT DEFAULT '',
  mark TEXT DEFAULT '',
  pax_count INTEGER DEFAULT 0,
  pax_names TEXT[] DEFAULT '{}',
  ship_name TEXT DEFAULT '',
  price NUMERIC DEFAULT 0,
  comment TEXT DEFAULT '',
  client TEXT DEFAULT '',
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  driver_user_temp TEXT DEFAULT '',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  stamps JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Insert drivers
-- =====================================================

`;

rawDrivers.forEach((drv) => {
  sql += `INSERT INTO drivers (name, "user", password, email, phone, color)
VALUES (${esc(drv.name)}, ${esc(drv.user)}, ${esc(drv.password || 'driver123')}, '', '', ${esc(drv.color || '#3ea0ff')});\n`;
});

sql += `
-- 3. Insert drives
-- =====================================================

`;

rawDrives.forEach((d, idx) => {
  // Convert pax_names string to Postgres array format
  let paxSql = "'{}'::TEXT[]";
  if (d.pax_names && typeof d.pax_names === 'string') {
    const names = d.pax_names.split(',').map(n => n.trim()).filter(Boolean);
    if (names.length > 0) {
      paxSql = `ARRAY[${names.map(n => esc(n)).join(', ')}]::TEXT[]`;
    }
  }

  // Robust Date and Time parsing
  let dateVal = d.date;
  let timeVal = d.time;

  // Format Excel serial date if parsed as number
  if (typeof dateVal === 'number') {
    // Excel base date is 1899-12-30
    const dateObj = new Date((dateVal - 25569) * 86400 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    dateVal = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
  }

  // Format Excel serial time if parsed as number
  if (typeof timeVal === 'number') {
    const totalMinutes = Math.round(timeVal * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    timeVal = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // Fallbacks for missing/invalid rows
  if (!dateVal || !timeVal) {
    console.log(`Warning: Row ${idx + 2} in Server Import has invalid date/time:`, JSON.stringify(d));
    return;
  }

  // Ensure time is HH:MM (convert "6.15" or similar if needed)
  if (String(timeVal).includes('.')) {
    timeVal = String(timeVal).replace('.', ':');
  }
  const parts = String(timeVal).split(':');
  if (parts.length === 2) {
    timeVal = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }

  let startTimeISO = '';
  try {
    startTimeISO = new Date(`${dateVal}T${timeVal}`).toISOString();
  } catch (err) {
    console.log(`Error parsing date: "${dateVal}T${timeVal}" at row ${idx + 2}:`, err.message);
    return;
  }

  sql += `INSERT INTO drives (date, time, vehicle_type, plate, destination_1, destination_2, destination_3, destination_4, destination_5, mark, pax_count, pax_names, ship_name, price, comment, client, driver_user_temp, start_time)
VALUES (${esc(dateVal)}, ${esc(timeVal)}, ${esc(d.vehicle_type || 'car')}, ${esc(d.plate)}, ${esc(d.destination_1)}, ${esc(d.destination_2)}, ${esc(d.destination_3)}, ${esc(d.destination_4)}, ${esc(d.destination_5)}, ${esc(d.mark)}, ${Number(d.pax_count || 0)}, ${paxSql}, ${esc(d.ship_name)}, ${Number(d.price || 0)}, ${esc(d.comment)}, ${esc(d.client)}, ${esc(d.driver_username)}, ${esc(startTimeISO)});\n`;
});

sql += `
-- 4. Link drives to drivers by username matching
-- =====================================================

UPDATE drives 
SET driver_id = drivers.id 
FROM drivers 
WHERE LOWER(drives.driver_user_temp) = LOWER(drivers.user);

-- 5. Drop temp column
-- =====================================================

ALTER TABLE drives DROP COLUMN IF EXISTS driver_user_temp;

-- 6. Grant anonymous API permissions & disable RLS
-- =====================================================

ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE drives DISABLE ROW LEVEL SECURITY;

GRANT ALL ON drivers TO anon;
GRANT ALL ON drives TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
`;

// Write the SQL file
const outputPath = join(__dirname, '..', '..', 'supabase_migration.sql');
writeFileSync(outputPath, sql, 'utf8');

console.log(`Successfully parsed:`);
console.log(`- ${rawDrivers.length} drivers`);
console.log(`- ${rawDrives.length} drives`);
console.log(`SQL migration file written to: ${outputPath}`);
