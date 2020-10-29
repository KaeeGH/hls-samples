import { Parser } from 'm3u8-parser'
import axios from 'axios'
import { sleep } from './utils'
import { segment } from './interfaces'

function getTsFiles(segments: Array<segment>): void {
  const uris: Array<string> = []
  for (const segment of segments) {
    uris.push(segment.uri)
    axios
      .get(segment.uri)
      .then((res) => console.log(segment.uri + ' ' + res.status))
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
    'https://video-weaver.tyo01.hls.ttvnw.net/v1/playlist/CoMFu0dnbdzucFfvUAO5zJpJyNsXz3HkUOgikbireAUtN0-DzirY56R4KfBgf6pg2bxnvFVY7LPrQ5kShjhJp_MYrycdRgwwFhuOrw2vAQY-PwqGAT_a5QmERZEWkEnSaMIIS1PicrFlojeYszHGqCIzDALrGdBc1_GpIz2MAW00leAF-IOrMJFCgvUhThh0t27zHLSVM3tvTjsQcLJTLorZAlxOaWuykDEULyuXT1Bup4uW-wzx_HZbBwwFkzXl2mr_Sye0qaOdH3CNM_un1mvMpN8tRstqfo8drnjBW1KMaPunI2942JFoND3gDcjNMQNULdSQwCPys115IA-EFJRlpYeuFMmbnP7_m09BLJbLcjWZJF7LU3VD8d-OASNsPpAJHSl5dBos7LyW1bPZaaABmGXjRmesLWLMd1Mgk6Ex9ObJKGg5buPaB2JzKbB7oKqEfRUNfA_H_HxFvR96wdd0U5BW4GwnFC1MNLoRIYZx7JJ3SrCkhfpdp4VkgnMwY5yv8Fo6_qTS8KDJfWHSZ5qsO7stpzilJKekqvGuDPdIhNbMnrmZGWEHlmOHhQG7ht8v49OFS5iy6LwCfQCib9w1574LoZ3T1bHwBo396pqjnssrvsQj7EJCXfsvOrwXilhfjNa8cLL44jGYTfSrTSUspDuWpnr9mzyBm9O1lgrY6WcMrCiQFWX8cZKNRxnhdmlTb6XE6VfCK448MuWQMZMfrSVugSsYSLlSx_nfa-_s7DAvyFkbICUNR2FQacGsawB2tH18aAs80ha1tOSlfQ8vQQGlcR4cpr5piy8ubvL7o_mf4InVu7eHPYN9c8NW-MwMw6rf7KWdipMwVOflCQgfYofwXBIQ0xO_BRgxBxf0kzwnz4Y-_xoMD-Y30wm3vZfSgZsb.m3u8'
  console.log('start')
  const parser = new Parser()
  axios
    .get<string>(srcUrl)
    .then((res) => {
      parser.push(res.data)
      console.log(parser.manifest.targetDuration)
      getTsFiles(parser.manifest.segments)
      sleep(parser.manifest.targetDuration - 5)
      reloadm3u8(parser.manifest.targetDuration, srcUrl, parser)
    })
    .catch((err) => console.log(err))
}

main()
