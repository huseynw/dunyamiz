const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const src = event.queryStringParameters?.src;
    if (!src) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ success: false, error: 'src parametrı yoxdur.' })
      };
    }

    const rawUrl = String(src).trim();
    const host = event.headers?.host || 'dunyamiz.me';
    const proto = event.headers?.['x-forwarded-proto'] || 'https';
    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `${proto}://${host}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

    if (!/^https?:\/\//i.test(url)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'URL düzgün deyil.' })
      };
    }

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 cover-proxy' }
    });

    if (!response.ok) {
      const raw = await response.text();
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: `Cover yüklənmədi (${response.status})`,
          details: raw?.slice(0, 500) || response.statusText
        })
      };
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const body = Buffer.from(arrayBuffer).toString('base64');

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      },
      body
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error?.message || 'Naməlum xəta'
      })
    };
  }
};
