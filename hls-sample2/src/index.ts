import { Hls } from './classes'

function main(): void {
  const client = new Hls(
    'http://localhost:3000/main.m3u8',
    'http://localhost:3000/'
  )
  client.initLoadm3u8()
  client.recurrentLoadm3u8()
}

main()
