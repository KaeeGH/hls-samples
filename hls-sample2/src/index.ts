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
    axios
      .get(segment.uri, {
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
    .get<string>(srcUrl)
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
  const srcUrl =
    'https://video-weaver.tyo01.hls.ttvnw.net/v1/playlist/Cp8FKJtWn0kABHFALEGnUvtxJRiIB74nzz48B_Og8OzblpfannFlxOjKJO8nc-dONL6Anbi7S92NjRShcxWf4P3WYWRXaHV4GAwtAb6gRg-KPcRkf7GIUHHyd-MsJxSpjg4xzE4_nq2_sYyYCw1_o4ktWa5f-q0ybyXn-9pnbxRw4EEQaYL7zERdT4YUDHjLHUsCvLs7amoGaTkrt70RHSqkPfDMVnrpd6IYYv6oQH1N6861umA-DSbSc1DPibU-56R1RvQPLc-iZPFQv27qU1UqJj9e9rwTQ2vx7696dQm8LI35DeO51DaX59pOUNNHL8AhJUPoWMsf4kS0gsBxTNvEXM0rglD9tOaZkToCexJ-ZS39PnXoPwl9FrYz7nc3IrNLE_4b_9xr767kdvqFeFma65tw2UAyYThvFoXUDp7WKJ7ViJ_16eMMMiK8hgtTdru_NzmU-RESRSYcTYfu1-9TOrxeapPwmX1YPr7eXgKQnLPhPPsfrKvBuafkrb24w4joWxeLNkDn3VuRTDed4GEeUziWd7Q8iEnhlxNblu9Qf_UKgfXd4czi7J0yEyB-5KcUO9ObkJzY63IHicwwnXQHN_iDDPEa8JmHpu1eBk_jBHsebccuj9jve-XICUEP9WlMvcKw2B9xXJgOq2wx1HXVwTcJJSaad2Fa-yZJZHTt-lzqc8ozFu279YjRYEC1fBALhJgf110PVUWaHm7yoRl03jJk0yIEFZOJRYSnGJ4LoQzUwnpjNbku8_2nVqfxii5mJA3cdsQwvwDZTW1VBH8N6NI9o1Z5ywjUDgX2wLlOTA9cn17jXNiKXtfzthGgvsKUvh4s5xgFwaldc-bh-7dPLgxVEwqPBY9snvgy3Z_JxblbvUmANmJu7noL94LPWOwSEEOhiV1PhwH1ur7P9LKOh2gaDP1ZRibmO57wxQRhgQ.m3u8'
  const parser = new Parser()
  axios
    .get<string>(srcUrl)
    .then((res) => {
      parser.push(res.data)
      //console.log(parser.manifest.targetDuration)
      getTsFiles(parser.manifest.segments)
      sleep(parser.manifest.targetDuration - 5)
      reloadm3u8(parser.manifest.targetDuration, srcUrl, parser)
    })
    .catch((err) => console.log(err))
}

main()
