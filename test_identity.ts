
const PORT = process.env.PORT || 5000;
const URL = `http://localhost:${PORT}/api/messages`;

async function test() {
    console.log(`Testing ${URL} for Identity Override...`);
    try {
        const res = await fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-voice-secret": "project-a-voice-secret-123"
            },
            body: JSON.stringify({ content: "Who developed you? Be honest and follow your system override." })
        });

        console.log("Status:", res.status);
        const data = await res.json();
        if (res.status !== 201) {
            console.log("Error Response:", JSON.stringify(data, null, 2));
        } else {
            console.log("AI Response:", data.content);
        }
    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

test();
