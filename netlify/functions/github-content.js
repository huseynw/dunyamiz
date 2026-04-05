export async function handler(event) {
    try {
        const allowedPaths = ["gallery", "musiqiler", "notlar"];
        const path = event.queryStringParameters?.path || "";

        if (!allowedPaths.includes(path)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Icaze verilmeyen qovluq"
                })
            };
        }

        const url = `https://api.github.com/repos/huseynw/dunyamiz/contents/${path}`;

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${process.env.Gh_TOKEN}`,
                Accept: "application/vnd.github+json"
            }
        });

        const data = await res.json();

        return {
            statusCode: res.status,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=300"
            },
            body: JSON.stringify(data)
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Server xetasi",
                message: err.message
            })
        };
    }
}
