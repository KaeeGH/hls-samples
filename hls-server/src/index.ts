import * as http from 'http'
import * as fs from 'fs'

const port = 3000
const server = http.createServer()

server.on('request', (request, response) => {
  response.statuCode = 200
  response.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
  const m3u8 = fs.readFileSync('./m3u8/m3u8/test0/test0.m3u8')
  response.write(m3u8)
  response.end()
})

server.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
