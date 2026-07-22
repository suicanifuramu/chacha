// Cloudflare Pages Function — reverse proxy for the anirole image CDN.
// Maps /cdn/* -> https://cdn.anirole.com/* (preserving path + query).
// The frontend builds image URLs as <PROXY>/cdn/unsafe/plain/<encoded>,
// so this forwards /cdn/unsafe/plain/<encoded> to the real CDN.

const TARGET_HOST = "https://cdn.anirole.com"

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

  const upstream = new Request(targetUrl, {
    method: request.method,
    headers: reqHeaders,
    body: request.body,
    redirect: "follow",
  })

  const res = await fetch(upstream)
  const resHeaders = new Headers(res.headers)
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
  const target = `${TARGET_HOST}/${path}${url.search}`
  return proxy(request, target)
}
