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
        let finalContent = payload.content;
        let commitMessage = `Admin Panel: ${type}`;

        if (type === "update_config") {
            const res = await fetch(url, { headers: { "Authorization": `token ${GH_TOKEN}` } });
            const fileData = await res.json();
            sha = fileData.sha;
            let oldContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
            
            if (payload.newDate) {
                oldContent = oldContent.replace(/const targetDate = new Date\("[^"]+"\);/, `const targetDate = new Date("${payload.newDate}:00");`);
            }
            if (payload.newCount) {
                oldContent = oldContent.replace(/meetingCount: \d+,/, `meetingCount: ${payload.newCount},`);
            }
            
            commitMessage = "Admin: Məlumatlar yeniləndi";
            finalContent = Buffer.from(oldContent).toString('base64');

        } else if (type === "upload_image") {
            commitMessage = "Admin: Yeni şəkil yükləndi";
        } else if (type === "upload_note") {
            commitMessage = "Admin: not əlavə edildi"; 
        } else if (type === "upload_music") { 
            // Musiqi üçün xüsusi commit mesajı
            commitMessage = "Admin: Yeni musiqi və məlumatları əlavə edildi 🎵"; 
        }

        // GitHub-a göndərmə əməliyyatı
        const ghResponse = await fetch(url, {
            method: 'PUT',
            headers: { "Authorization": `token ${GH_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                message: commitMessage,
                content: finalContent, // hcayar.js-dən gələn base64 buraya düşür
                sha: sha || undefined
            })
        });

        const resData = await ghResponse.json();
        return { statusCode: 200, body: JSON.stringify({ success: ghResponse.ok, details: resData }) };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
