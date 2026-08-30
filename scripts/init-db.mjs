// Creates the schema in the database named by DATABASE_URL.
// Usage: npm run db:init   (add --seed for a handful of example rows)
import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.');
  process.exit(1);
}

const sql = neon(url);
const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');

/**
 * Run one statement that is a plain string rather than a template literal.
 *
 * `neon()` returns a template-tag function; the `sql.query(text)` helper only
 * exists in later releases of the driver. Handing the tag a strings array
 * (with `raw`, as a real tagged template has) sends the statement verbatim
 * with no parameters, which is what schema DDL needs.
 */
const run = (text) => sql(Object.assign([text], { raw: [text] }));

// The driver sends one statement per call, so split the file on semicolons.
const statements = schema
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s && !s.split('\n').every((line) => line.trim().startsWith('--')));

for (const statement of statements) {
  try {
    await run(statement);
  } catch (error) {
    console.error(`Failed on:\n${statement}\n\n${error.message}`);
    process.exit(1);
  }
}
console.log(`Schema applied (${statements.length} statements).`);

if (process.argv.includes('--seed')) {
  const today = new Date().toISOString().slice(0, 10);
  await sql`insert into tasks (title, priority, due_date) values
    ('Review the quarterly numbers', 1, ${today}),
    ('Reply to the design feedback', 2, ${today}),
    ('Book the dentist', 3, null)`;
  await sql`insert into habits (name) values ('Morning walk'), ('Read 20 pages'), ('No phone after 10pm')`;
  console.log('Seeded example tasks and habits.');
}
