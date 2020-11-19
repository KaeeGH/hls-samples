import { Parser } from 'm3u8-parser'
import { Readable } from 'stream'
import * as fs from 'fs'
import axios from 'axios'
import { sleep } from './utils'
import { segment } from './interfaces'
import { Encoder, Decoder } from 'ts-coder'

function writeBinFile(payload: ArrayBuffer, count: number) {
  const arrayBuffed = new Uint8Array(payload)
  fs.writeFileSync(String(count) + 'head.bin', arrayBuffed)
}

function parseTsFile(tsFile: ArrayBuffer, decoder: Decoder) {
  decoder.push(Buffer.from(tsFile))
}

async function getTsFiles(
  segments: Array<segment>,
  onFetched: (data: ArrayBuffer) => void
): Promise<void> {
  for (const segment of segments) {
    //相対パスと絶対パスの場合があるのでそれに対応する必要がある
    const res = await axios.get('http://localhost:3000/' + segment.uri, {
      responseType: 'arraybuffer',
      headers: { 'content-Type': 'video/mp2t' },
    })
    onFetched(res.data)
  }
}

function deleteDuplication(segments: Array<segment>): Array<segment> {
  try {
    for (const index in segments) {
      for (const segment of segments) {
        if (segments[index].uri == segment.uri) {
          segments.splice(parseInt(index), 1)
        }
      }
    }
    return segments
  } catch (err) {
    return segments
  }
}

//再帰関数にすればよさげ
function reloadm3u8(
  maxduration: number,
  srcUrl: string,
  parser: Parser,
  decoder: Decoder
) {
  axios
    .get<string>(srcUrl, {
      headers: { 'content-Type': 'application/vnd.apple.mpegurl' },
    })
    .then((res) => {
      parser.push(res.data)
      console.log('fetched')
      const segments: Array<segment> = deleteDuplication(
        parser.manifest.segments
      )
      getTsFiles(segments, (data: ArrayBuffer) => parseTsFile(data, decoder))
      sleep(maxduration - 5)
      reloadm3u8(maxduration, srcUrl, parser, decoder)
    })
    .catch((err) => console.log(err))
}

function main(): void {
  const srcUrl = 'http://localhost:3000/test0.m3u8'
  let count = 0
  const parser = new Parser()
  const decoder = new Decoder({
    headSize: 4,
    isEnd(head) {
      if (head[0] === 0x02) {
        return true
      } else {
        return false
      }
    },
  })

  decoder.onData((buffer) => {
    console.log(buffer)
    const arrayBuffed = new Uint8Array(buffer)
    fs.writeFileSync(`test${count}.jpg`, arrayBuffed)
    count++
  })

  axios
    .get<string>(srcUrl, {
      headers: { 'content-Type': 'application/vnd.apple.mpegurl' },
    })
    .then((res) => {
      parser.push(res.data)
      //console.log(parser.manifest.targetDuration)
      getTsFiles(parser.manifest.segments, (data: ArrayBuffer) =>
        parseTsFile(data, decoder)
      )
      sleep(parser.manifest.targetDuration - 5)
      reloadm3u8(parser.manifest.targetDuration, srcUrl, parser, decoder)
    })
    .catch((err) => console.log(err))
}

main()
