import { Parser } from 'm3u8-parser'
import axios from 'axios'
import { sleep } from './utils'
import { segment } from './interfaces'

function getTsFiles(baseUri: string, segmentUris: Array<string>): void {
  for (const uri of segmentUris) {
    axios
      .get<string>(baseUri + uri)
      .then((res) => console.log(baseUri + uri + ' ' + res.statusText))
      .catch((err) => console.log(err))
  }
}

function main(): void {
  const srcUrl =
    'https://video-weaver.tyo01.hls.ttvnw.net/v1/playlist/CoMFu0dnbdzucFfvUAO5zJpJyNsXz3HkUOgikbireAUtN0-DzirY56R4KfBgf6pg2bxnvFVY7LPrQ5kShjhJp_MYrycdRgwwFhuOrw2vAQY-PwqGAT_a5QmERZEWkEnSaMIIS1PicrFlojeYszHGqCIzDALrGdBc1_GpIz2MAW00leAF-IOrMJFCgvUhThh0t27zHLSVM3tvTjsQcLJTLorZAlxOaWuykDEULyuXT1Bup4uW-wzx_HZbBwwFkzXl2mr_Sye0qaOdH3CNM_un1mvMpN8tRstqfo8drnjBW1KMaPunI2942JFoND3gDcjNMQNULdSQwCPys115IA-EFJRlpYeuFMmbnP7_m09BLJbLcjWZJF7LU3VD8d-OASNsPpAJHSl5dBos7LyW1bPZaaABmGXjRmesLWLMd1Mgk6Ex9ObJKGg5buPaB2JzKbB7oKqEfRUNfA_H_HxFvR96wdd0U5BW4GwnFC1MNLoRIYZx7JJ3SrCkhfpdp4VkgnMwY5yv8Fo6_qTS8KDJfWHSZ5qsO7stpzilJKekqvGuDPdIhNbMnrmZGWEHlmOHhQG7ht8v49OFS5iy6LwCfQCib9w1574LoZ3T1bHwBo396pqjnssrvsQj7EJCXfsvOrwXilhfjNa8cLL44jGYTfSrTSUspDuWpnr9mzyBm9O1lgrY6WcMrCiQFWX8cZKNRxnhdmlTb6XE6VfCK448MuWQMZMfrSVugSsYSLlSx_nfa-_s7DAvyFkbICUNR2FQacGsawB2tH18aAs80ha1tOSlfQ8vQQGlcR4cpr5piy8ubvL7o_mf4InVu7eHPYN9c8NW-MwMw6rf7KWdipMwVOflCQgfYofwXBIQ0xO_BRgxBxf0kzwnz4Y-_xoMD-Y30wm3vZfSgZsb.m3u8'
  const srcBaseUrl =
    'https://devstreaming-cdn.apple.com/videos/wwdc/2019/502gzyuhh8p2r8g8/502/1920/'
  const uris: Array<string> = []
  let maxduration = 0
  console.log('start')
  axios.get<string>(srcUrl).then((res) => {
      const parser = new Parser()
      parser.push(res.data)
      // const segments: Array<segment> = parser.manifest.segments
      // for (const segment of segments) {
      //   uris.push(segment.uri)
      // }
      // getTsFiles(srcBaseUrl, uris)
      maxduration = parser.manifest.targetDuration
      console.log(maxduration)
    }).catch((err) => console.log(err))

  while (true) {
    console.log('in loop')
    sleep(maxduration)
    axios
      .get<string>(srcUrl)
      .then((res) => {
        const parser = new Parser()
        parser.push(res.data)
        // const segments: Array<segment> = parser.manifest.segments
        // for (const segment of segments) {
        //   uris.push(segment.uri)
        // }
        // getTsFiles(srcBaseUrl, uris)
        console.log(parser.manifest)
      })
      .catch((err) => console.log(err))
  }
}

main()
