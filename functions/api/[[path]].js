// Cloudflare Pages Function — reverse proxy for the anirole API.
// Maps /api/* -> https://anirole.com/api/* (preserving path + query).
// Handles CORS preflight and streams the upstream response back (SSE-safe).

const TARGET_HOST = "https://anirole.com"

function corsHeaders(request) {
  const origin = request.headers.get("Origin")
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type,Authorization,x-anirole-app-version,x-anirole-client-type,x-anirole-platform,x-anirole-timezone,User-Agent",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  }
}

function addCors(headers, request) {
  for (const [k, v] of Object.entries(corsHeaders(request))) {
    headers.set(k, v)
  }
}

async function proxy(request, targetUrl) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) })
  }

  const reqHeaders = new Headers(request.headers)
  reqHeaders.delete("host")
  reqHeaders.delete("origin")
  // Don't send accept-encoding — prevents Google Frontend from adding gzip,
  // which would cause workerd to buffer the entire response.
  reqHeaders.delete("accept-encoding")

  const upstream = new Request(targetUrl, {
    method: request.method,
    headers: reqHeaders,
    body: request.body,
    duplex: "half",
    redirect: "follow",
  })

  const res = await fetch(upstream)
  const resHeaders = new Headers(res.headers)

  // workerd adds content-encoding: gzip even when upstream sends none,
  // which kills SSE streaming. Override with "identity" to prevent it.
  resHeaders.set("content-encoding", "identity")

  // Drop hop-by-hop + length headers so SSE streams as chunked instead of
  // the runtime trying to match a fixed Content-Length.
  resHeaders.delete("content-length")
  for (const h of ["connection", "keep-alive", "transfer-encoding"]) {
    resHeaders.delete(h)
  }
  addCors(resHeaders, request)

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: resHeaders,
  })
}

export async function onRequest(context) {
  const { request, params } = context
  const url = new URL(request.url)
  const path = Array.isArray(params.path)
    ? params.path.join("/")
    : params.path || ""
  const target = `${TARGET_HOST}/api/${path}${url.search}`
  return proxy(request, target)
}
