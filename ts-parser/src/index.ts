import * as fs from 'fs'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const parser = require('mpeg2ts-parser')()

function writePayloadBinFile(payload: ArrayBuffer, count: number) {
  const arrayBuffed = new Uint8Array(payload)
  fs.writeFileSync(String(count) + 'payload.bin', arrayBuffed)
}

function main(): void {
  const m2ts = fs.createReadStream('0.ts', { encoding: null })
  let count = 0
  parser.on('data', (data) => {
    if (count <= 3) {
      console.log(count)
      console.log(data)
    }
    writePayloadBinFile(data.payload, count)
    count++
  })
  m2ts.pipe(parser)
}

main()
