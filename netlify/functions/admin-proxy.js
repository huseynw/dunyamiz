const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { type, password, payload } = JSON.parse(event.body);
        const GH_TOKEN = process.env.GH_TOKEN;
        const repoOwner = "huseynw";
        const repoName = "dunyamiz";

        if (password !== "030825") return { statusCode: 401, body: JSON.stringify({ error: "Şifrə səhvdir!" }) };

        let url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${payload.path}`;
        
        let sha = "";
        let finalContent = payload.content; // Şəkil üçün birbaşa gələn content

        // Əgər config yenilənirsə, əvvəlcə mövcud faylı BACKEND-də oxuyuruq
        if (type === "update_config") {
            const res = await fetch(url, { headers: { "Authorization": `token ${GH_TOKEN}` } });
            const fileData = await res.json();
            sha = fileData.sha;
            
            let oldContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
            
            // Dəyişiklikləri tətbiq edirik
            if (payload.newDate) {
                oldContent = oldContent.replace(/const targetDate = new Date\("[^"]+"\);/, `const targetDate = new Date("${payload.newDate}:00");`);
            }
            if (payload.newCount) {
                oldContent = oldContent.replace(/meetingCount: \d+,/, `meetingCount: ${payload.newCount},`);
            }
            finalContent = Buffer.from(oldContent).toString('base64');
        }

        const ghResponse = await fetch(url, {
            method: 'PUT',
            headers: { "Authorization": `token ${GH_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `Admin Panel: ${type}`,
                content: finalContent,
                sha: sha || undefined
            })
        });

        return { statusCode: 200, body: JSON.stringify({ success: ghResponse.ok }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
