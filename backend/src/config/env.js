import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
console.log(`[Env Init] Environment variables loaded. MONGODB_URI: ${process.env.MONGODB_URI ? 'Defined' : 'UNDEFINED'}`);
