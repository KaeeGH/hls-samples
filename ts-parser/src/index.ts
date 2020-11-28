import * as fs from 'fs'
import { Encoder, Decoder } from 'ts-coder'

function writePayloadBinFile(payload: ArrayBuffer, count: number) {
  const arrayBuffed = new Uint8Array(payload)
  fs.writeFileSync(String(count) + 'payload.bin', arrayBuffed)
}

function main(): void {
  const encoder = new Encoder({
    pid: 0x30,
    headSize: 4,
    preMap(buffer, index, buffers) {
      let status = 0x00

      if (index === buffers.length - 1) {
        status = 0x01
      }

      return Buffer.concat([Buffer.from([status, 0x00, 0x00, 0x00]), buffer])
    },
  })

  const packets = encoder.encode(Buffer.from('hello world'))

  // Decode part.

  const decoder = new Decoder({
    headSize: 4,
    isEnd(head) {
      return head[0] === 0x01
    },
  })

  console.log(packets)

  decoder.onData((buffer) => {
    console.log(buffer) // buffer with "hello world" string
  })

  for (const packet of packets) {
    decoder.push(packet)
  }
}

main()
