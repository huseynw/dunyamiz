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

        const headers = {
            Authorization: `Bearer ${process.env.GH_TOKEN}`,
            Accept: "application/vnd.github+json"
        };

        const url = `https://api.github.com/repos/huseynw/dunyamiz/contents/${path}`;

        const res = await fetch(url, { headers });
        const data = await res.json();

        if (!res.ok) {
            return {
                statusCode: res.status,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "public, max-age=300"
                },
                body: JSON.stringify(data)
            };
        }

        if (!Array.isArray(data)) {
            return {
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "public, max-age=300"
                },
                body: JSON.stringify(data)
            };
        }

        const enrichedData = await Promise.all(
            data.map(async (item) => {
                if (item.type !== "file") {
                    return item;
                }

                try {
                    const commitsUrl = `https://api.github.com/repos/huseynw/dunyamiz/commits?path=${encodeURIComponent(item.path)}&per_page=1`;

                    const commitRes = await fetch(commitsUrl, { headers });
                    const commitData = await commitRes.json();

                    let git_date = null;

                    if (commitRes.ok && Array.isArray(commitData) && commitData.length > 0) {
                        git_date =
                            commitData[0]?.commit?.committer?.date ||
                            commitData[0]?.commit?.author?.date ||
                            null;
                    }

                    return {
                        ...item,
                        git_date
                    };
                } catch {
                    return {
                        ...item,
                        git_date: null
                    };
                }
            })
        );

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=300"
            },
            body: JSON.stringify(enrichedData)
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
