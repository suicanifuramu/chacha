const http = require("http")
const fs = require("fs")
const path = require("path")

const PORT = 3001

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  let filePath = path.join(__dirname, url.pathname === "/" ? "index.html" : url.pathname)
  filePath = path.normalize(filePath)

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403)
    res.end("Forbidden")
    return
  }

  const ext = path.extname(filePath)
  if (!fs.existsSync(filePath)) {
    res.writeHead(404)
    res.end("Not Found")
    return
  }

  const content = fs.readFileSync(filePath)
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" })
  res.end(content)
})

server.listen(PORT, () => {
  console.log(`\n  Googleログインページ: http://localhost:${PORT}/\n`)
})
