import * as http from 'http'
import * as fs from 'fs'

const port = 3000
const server = http.createServer()

server.on('request', (request, response) => {
  console.log(request.headers)
  console.log(request.url)
  response.statuCode = 200
  response.setHeader('Content-Type', request.headers['content-type'])
  try {
    const data = fs.readFileSync('./m3u8/m3u8/test0' + request.url)
    response.write(data)
  } catch {
    response.write('no such file or directory')
  }
  response.end()
})

server.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
