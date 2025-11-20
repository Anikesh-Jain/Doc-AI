const analyzeBtn = document.getElementById("analyzeBtn");
const fileInput = document.getElementById("fileInput");
const loading = document.getElementById("loading");
const summaryEl = document.getElementById("summary");
const detailsEl = document.getElementById("details");
const importantEl = document.getElementById("important");
const remindersEl = document.getElementById("reminders");

const API_KEY = "AIzaSyAwNq0sWlYvO37P-b1AKmHQ08p-r2SMWCU";

async function encodeImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(file);
    });
}

analyzeBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) return alert("Please upload an image!");

    loading.style.display = "block";
    summaryEl.textContent = "";
    detailsEl.textContent = "";
    importantEl.textContent = "";
    remindersEl.textContent = "";

    const base64Image = await encodeImage(file);

    const body = {
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text:
                            "Extract ALL text from the document first.\n" +
                            "Then provide sections like:\n\nSummary:\n<summary here>\n\nImportant Points:\n<important points>\n\nReminders:\n<reminders>"
                    },
                    {
                        inline_data: {
                            mime_type: file.type,
                            data: base64Image
                        }
                    }
                ]
            }
        ]
    };

    try {
        const res = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-goog-api-key": API_KEY   // ✅ This is the correct header
                },
                body: JSON.stringify(body)
            }
        );

        const data = await res.json();
        console.log(data);

        let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No data received.";

        // CLEAN FORMAT
        text = text.replace(/^\s*\*\s*/gm, "").replace(/\*/g, "").replace(/\n{3,}/g, "\n\n");

        // Extract sections
        const summaryMatch = text.match(/summary:\s*([\s\S]*?)(important points:|reminders:|$)/i);
        const importantMatch = text.match(/important points:\s*([\s\S]*?)(reminders:|$)/i);
        const remindersMatch = text.match(/reminders:\s*([\s\S]*)/i);

        summaryEl.textContent = summaryMatch ? summaryMatch[1].trim() : "Summary not found.";
        importantEl.textContent = importantMatch ? importantMatch[1].trim() : "No important points.";
        remindersEl.textContent = remindersMatch ? remindersMatch[1].trim() : "No reminders.";

        // Details = everything before summary
        const summaryIndex = text.toLowerCase().indexOf("summary:");
        detailsEl.textContent = summaryIndex !== -1 ? text.slice(0, summaryIndex).trim() : text;

    } catch (err) {
        detailsEl.textContent = "Error: " + err.message;
    }

    loading.style.display = "none";
});
