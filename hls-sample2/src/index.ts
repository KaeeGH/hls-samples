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
    '	https://video-weaver.tyo01.hls.ttvnw.net/v1/playlist/Cp8FSzRmNYVwpXa20aHnQ6DyAg-1TKoHV4p2XJCEbHWWceTSkVRyZKibgcJzr3JJAIBXpXmCCkb0T6SLwAYMAcb3akJMJXcPjR4NGo-T1GG0pSl4_UVACzNN9D9SgDLV40E4ALL1sccZweP5XDStzwRS-Lg3X6ElTpQV94ckTCfexx_AsOHIhQ2XXfX4FXAFG99PRU00jOb7Ykr03MHtfwH2cIFd8mL095wSFMOBZm2jnfLPfZvW2jOeP-B1wRgsH3cqVWDk6YDeHQLAFsHxijYZc434MwRDa1gub0gNNj-XQkJAYhkfTSyCkS5TdoLXH6Jjgv7AaiS_N9_dtb8tE5hwB2yZ6tlkZyfdw0gwA4Quk_f3d7OKquV1JduAueQYdMYVzDP4K-ktdeVjWEtl1oqAvCplgSI1-ufX8qzB0f_q4C1j9IpOXgAH8D7p-9hMzycbmYt5znNrsXs79HDsYKKxO-GWi0ABsOAz3lCvxL2Kinwt4frN_KRIAt4WzmbzmfysH6EXJZ34iL3LlJv-R2QDCbP1OD2BUPTHCEqsrDnyrc3QwB2bZGLrnlq4-GabiW68vKb-ptzGsvj0YgjWUmc1ixOuyMnQA1AnVnMwwcue0_3MpFISOb7USnkPGPCbn-U1LHvpXhlHuy4UJrLL-wINRVVhb_dQcly7RoxZHYNT5tdNiQhy4uxGC0OWjIB_HravvLJ5JdpshQMI0ku0mu3Ik6JOaRrte6HfhsayHk_armZncq99OLTUKu4CUaGvkAMVmqxnD9gNWehh-Q_ajJXNVKD5PoJGwvOYCsjvsishGKqx0qgSdcv6eLAyyRYO19epZplWLoTvbLd97A0b3KnSd_-ak2w1Qqj5n6lV2IAOGMjrNjfChcq44nfud13yVdUSEFugPh87gV59YFbw5VUkB_saDHe2-SgL67Rt-3rphA.m3u8'
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
