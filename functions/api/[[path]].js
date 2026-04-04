/**
 * Cloudflare Pages Function – API Proxy
 *
 * Reguläre API-Calls:  /api/spellcheck  →  Worker /spellcheck
 *
 * OAuth-Routen werden NICHT proxied – der Browser wird direkt
 * zum Worker weitergeleitet, damit GitHub/Google-Redirects
 * korrekt funktionieren (server-seitiges redirect:follow würde
 * GitHub-HTML zurückliefern und alles kaputt machen).
 */

const WORKER_BASE = 'https://rechtschreibe-api.karol-paschek.workers.dev';

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const workerPath = url.pathname.replace(/^\/api/, '') || '/';

    // ── OAuth-Routen: direkt zum Worker weiterleiten (302) ────────────
    // Der Browser folgt dem Redirect nativ → kein server-seitiges
    // Redirect-Folgen, kein vermischter Response-Body.
    if (workerPath.startsWith('/oauth')) {
        const workerUrl = WORKER_BASE + workerPath + url.search;
        return Response.redirect(workerUrl, 302);
    }

    // ── CORS Preflight ────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin':  '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    // ── Regulärer API-Proxy (kein redirect:follow!) ───────────────────
    const workerUrl = WORKER_BASE + workerPath + url.search;

    const headers = new Headers(request.headers);
    headers.set('Host', new URL(WORKER_BASE).host);

    const response = await fetch(workerUrl, {
        method:   request.method,
        headers:  headers,
        body:     ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'manual',   // Keine server-seitigen Redirects folgen
    });

    // Server-seitige Redirects (3xx) transparent durchreichen
    if (response.status >= 301 && response.status <= 308) {
        const location = response.headers.get('Location');
        if (location) {
            return Response.redirect(location, response.status);
        }
    }

    // Opaque Redirect (redirect:'manual' liefert status=0 in einigen Umgebungen)
    if (response.type === 'opaqueredirect' || response.status === 0) {
        const location = response.headers.get('Location');
        if (location) return Response.redirect(location, 302);
    }

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin',  '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return new Response(response.body, {
        status:  response.status,
        headers: responseHeaders,
    });
}
