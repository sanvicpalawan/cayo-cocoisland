import { neon } from '@neondatabase/serverless';
console.log('API test function loaded');

export default async function handler(req, res) {
  console.log('API test function called');
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log('DB connection acquired');
    const result = await sql`SELECT version()`;
    console.log('Query result:', result[0].version);
    return new Response(JSON.stringify({ version: result[0].version }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in handler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
