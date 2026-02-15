
const PORT = process.env.PORT || 5000;
const API_URL = `http://localhost:${PORT}/api/messages`;

async function test() {
    console.log(`Testing ${API_URL} with INVALID Bearer token...`);
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer invalid-token-here"
            },
            body: JSON.stringify({ content: "Hello from invalid user" })
        });

        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Response Body:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

test();
