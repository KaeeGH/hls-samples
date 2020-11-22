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

function getTsFiles(segments: Array<segment>, decoder: Decoder) {
  for (const segment of segments) {
    //相対パスと絶対パスの場合があるのでそれに対応する必要がある
    axios
      .get('http://localhost:3000/' + segment.uri, {
        responseType: 'arraybuffer',
        headers: { 'content-Type': 'video/mp2t' },
      })
      .then((res) => parseTsFile(res.data, decoder))
  }
}

function deleteDuplication(segments: Array<segment>): Array<segment> {
  const removed: Array<segment> = []
  for (const index in segments) {
    console.log(segments[index])
    if (parseInt(index) === 0) {
      removed.push(segments[index])
    } else {
      //すでに同じデータが入力されていないかを確かめる
      let duplecated: boolean
      duplecated = false
      for (const j in removed) {
        if (segments[index].uri === removed[j].uri) {
          duplecated = true
        }
      }
      //同じデータがなければ追加
      if (!duplecated) {
        removed.push(segments[index])
      }
    }
  }
  return removed
}

function removeProcessed(
  segments: Array<segment>,
  proccessedSegments: Array<segment>
): Array<segment> {
  const removed: Array<segment> = []
  for (const index in segments) {
    if (!(segments[index] === proccessedSegments[index])) {
      removed.push(segments[index])
    }
  }
  return removed
}

//再帰関数にすればよさげ
function reloadm3u8(
  maxduration: number,
  srcUrl: string,
  parser: Parser,
  decoder: Decoder,
  proccessedSegments: Array<segment>
) {
  axios
    .get<string>(srcUrl, {
      headers: { 'content-Type': 'application/vnd.apple.mpegurl' },
    })
    .then((res) => {
      parser.push(res.data)
      // console.log('fetched')
      // console.log(parser.manifest.segments)
      const fetchedSegments = parser.manifest.segments
      //const segments: Array<segment> = deleteDuplication(fetchedSegments)
      // const toFetch: Array<segment> = removeProcessed(
      //   parser.manifest.segments,
      //   proccessedSegments
      // )
      // console.log(parser.manifest.segments)
      // console.log(toFetch.length)
      // if (toFetch.length !== 0) {
      //   getTsFiles(toFetch, decoder)
      //   proccessedSegments = proccessedSegments.concat(toFetch)
      //   sleep(maxduration - 5)
      //   reloadm3u8(maxduration, srcUrl, parser, decoder, toFetch)
      // }
    })
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
      //メインスレッドと別なメモリ空間でparserのインスタンスが管理されていてparser.push()をコールすると
      //こちらでgetTsFileがコールされる前にコールされた場合getTsFileに不正な引数が入る
      const fetchedSegments = parser.manifest.segments
      const segments: Array<segment> = deleteDuplication(fetchedSegments)
      console.log(segments)
      getTsFiles(segments, decoder)
      const proccessedSegments = segments
      sleep(parser.manifest.targetDuration)
      reloadm3u8(
        parser.manifest.targetDuration,
        srcUrl,
        parser,
        decoder,
        proccessedSegments
      )
    })
    .catch((err) => console.log(err))
}

main()
