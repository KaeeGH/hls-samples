import { Parser } from 'm3u8-parser'
import axios from 'axios'
import { segment } from './interfaces'

function getTsFiles(baseUri: string, segmentUris: Array<string>): void {
  for (const uri of segmentUris) {
    axios
      .get<string>(baseUri + uri)
      .then((res) => console.log(res.statusText))
      .catch((err) => console.log(err))
  }
}

function main(): void {
  const srcUrl =
    'https://devstreaming-cdn.apple.com/videos/wwdc/2019/502gzyuhh8p2r8g8/502/1920/1920.m3u8'
  const srcBaseUrl =
    'https://devstreaming-cdn.apple.com/videos/wwdc/2019/502gzyuhh8p2r8g8/502/1920/'
  const uris: Array<string> = []
  axios
    .get<string>(srcUrl)
    .then((res) => {
      const parser = new Parser()
      parser.push(res.data)
      const segments: Array<segment> = parser.manifest.segments
      for (const segment of segments) {
        uris.push(segment.uri)
      }
      getTsFiles(srcBaseUrl, uris)
    })
    .catch((err) => console.log(err))
}

main()
