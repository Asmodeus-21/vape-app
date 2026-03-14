import { registerUser } from './server/auth.ts';

async function test() {
    const res = await registerUser('backend-vendor-2@test.com', 'password123', 'Backend Vendor 2', 'vendor');
    console.log('Register Result:', JSON.stringify(res, null, 2));
}

test();
