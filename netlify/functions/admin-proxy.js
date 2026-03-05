const fetch = require('node-fetch');
exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }
    const { type, password, payload } = JSON.parse(event.body);
    const GH_TOKEN = process.env.GH_TOKEN;
    if (password !== "030825") {
        return { statusCode: 401, body: JSON.stringify({ error: "Yanlış şifrə!" }) };
    }
    const repoOwner = "huseynw"; 
    const repoName = "dunyamiz";
    try {
        let url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${payload.path}`;
        let sha = "";
        if (type === "update_config") {
            const currentFile = await fetch(url, {
                headers: { "Authorization": `token ${GH_TOKEN}` }
            }).then(res => res.json());
            sha = currentFile.sha;
        }
        const ghResponse = await fetch(url, {
            method: 'PUT',
            headers: {
                "Authorization": `token ${GH_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Admin Panel: ${type}`,
                content: payload.content,
                sha: sha || undefined
            })
        });
        const result = await ghResponse.json();
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, data: result })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
