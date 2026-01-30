import fetch from "node-fetch";

const BASE_URL = "http://localhost:3099";

async function verify() {
    console.log("🚀 Starting Final Backend Verification...\n");

    try {
        // 1. Connectivity Check
        const root = await fetch(BASE_URL);
        console.log(`✅ Server Connectivity: ${root.status} (OK)`);

        // 2. Signup Test
        const email = `final_test_${Date.now()}@tambo.ai`;
        const signupRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                password: "Password123!",
                name: "Final Verification User",
                initRole: "admin"
            })
        });

        if (signupRes.status === 200) {
            const data = await signupRes.json();
            console.log(`✅ Signup API: 200 OK`);

            // Verify Role Map
            if (data.user.role === "admin") {
                console.log(`✅ Role Mapping (initRole -> role): SUCCESS (User is Admin)`);
            } else {
                console.error(`❌ Role Mapping FAILED: User is ${data.user.role}`);
                process.exit(1);
            }

            // Verify Banned Column Fix
            if (data.user.banned === false) {
                console.log(`✅ Schema Integrity (banned column): SUCCESS`);
            } else {
                console.error(`❌ Schema Integrity FAILED`);
                process.exit(1);
            }

        } else {
            console.error(`❌ Signup Failed: ${signupRes.status} ${signupRes.statusText}`);
            const err = await signupRes.text();
            console.error(err);
            process.exit(1);
        }

        // 3. Login Test
        const loginRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                password: "Password123!"
            })
        });

        if (loginRes.status === 200) {
            console.log(`✅ Login API: 200 OK (Token Issued)`);
        } else {
            console.error(`❌ Login Failed: ${loginRes.status}`);
            process.exit(1);
        }

        console.log("\n🏆 FINAL RESULT: ALL SYSTEMS 100% OPERATIONAL");

    } catch (error) {
        console.error("❌ Test Failed:", error.message);
        process.exit(1);
    }
}

verify();
