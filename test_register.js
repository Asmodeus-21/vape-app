import { registerUser } from './server/auth.js';

async function test() {
    const res = await registerUser('backend-vendor@test.com', 'password123', 'Backend Vendor', 'vendor');
    console.log('Register Result:', JSON.stringify(res, null, 2));
}

test();
