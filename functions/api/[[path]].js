/**
 * Cloudflare Pages Function – API Proxy
 * Leitet alle Anfragen an /api/* transparent an den Worker weiter.
 * Dadurch wird aus:  https://rechtschreibe-api.karol-paschek.workers.dev/spellcheck
 *                    https://framespell.pages.dev/api/spellcheck
 *
 * Datei: functions/api/[[path]].js  (Catch-all-Route)
 */

const WORKER_BASE = 'https://rechtschreibe-api.karol-paschek.workers.dev';

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    // /api/spellcheck  →  /spellcheck  usw.
    const workerPath = url.pathname.replace(/^\/api/, '') || '/';
    const workerUrl  = WORKER_BASE + workerPath + url.search;

    // Original-Headers übernehmen, Host anpassen
    const headers = new Headers(request.headers);
    headers.set('Host', new URL(WORKER_BASE).host);

    const proxyRequest = new Request(workerUrl, {
        method:  request.method,
        headers: headers,
        body:    ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'follow',
    });

    const response = await fetch(proxyRequest);

    // CORS-Header setzen damit framespell.pages.dev die Antwort nutzen kann
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin',  '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: responseHeaders });
    }

    return new Response(response.body, {
        status:  response.status,
        headers: responseHeaders,
    });
}
