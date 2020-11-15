import * as http from 'http'

const port = 3000
const server = http.createServer()

server.on('request', (request, response) => {
  response.statuCode = 200
  response.setHeader('Content-Type', 'text/plain')
  response.write('Hello, world!')
  response.end()
})

server.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
