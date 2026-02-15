
const PORT = process.env.PORT || 5000;
const URL = `http://localhost:${PORT}/api/messages`;

async function test() {
    console.log(`Testing ${URL} with Voice Secret bypass...`);
    try {
        const res = await fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-voice-secret": "project-a-voice-secret-123"
            },
            body: JSON.stringify({ content: "What is today's date and time?" })
        });

        console.log("Status:", res.status);
        const data = await res.json();
        console.log("AI Response:", data.content);
    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

test();
