import { Parser } from 'm3u8-parser'
import { Readable } from 'stream'
import * as fs from 'fs'
import axios from 'axios'
import { sleep } from './utils'
import { segment } from './interfaces'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const parser = require('mpeg2ts-parser')()

function parseTsFile(tsFile: ArrayBuffer) {
  const readable = new Readable()
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  readable._read = () => {}
  readable.push(tsFile)
  readable.push(null)
  parser.on('data', (data) => {
    console.log(data.payload)
  })
  readable.pipe(parser)
  readable.destroy()
}

function getTsFiles(segments: Array<segment>): void {
  const uris: Array<string> = []
  for (const segment of segments) {
    uris.push(segment.uri)
    //相対パスと絶対パスの場合があるのでそれに対応する必要がある
    axios
      .get('http://localhost:3000/' + segment.uri, {
        responseType: 'arraybuffer',
        headers: { 'content-Type': 'video/mp2t' },
      })
      .then((res) => {
        console.log(res.status)
        //console.log(res.data)
        parseTsFile(res.data)
      })
      .catch((err) => console.log(err))
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
function reloadm3u8(maxduration: number, srcUrl: string, parser: Parser) {
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
      getTsFiles(segments)
      sleep(maxduration - 5)
      reloadm3u8(maxduration, srcUrl, parser)
    })
    .catch((err) => console.log(err))
}

function main(): void {
  const srcUrl = 'http://localhost:3000/test0.m3u8'
  const parser = new Parser()
  axios
    .get<string>(srcUrl, {
      headers: { 'content-Type': 'application/vnd.apple.mpegurl' },
    })
    .then((res) => {
      parser.push(res.data)
      //console.log(parser.manifest.targetDuration)
      getTsFiles(parser.manifest.segments)
      //sleep(parser.manifest.targetDuration - 5)
      //reloadm3u8(parser.manifest.targetDuration, srcUrl, parser)
    })
    .catch((err) => console.log(err))
}

main()
