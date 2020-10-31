import { Parser } from 'm3u8-parser'
import * as fs from 'fs'
import axios from 'axios'
import { sleep } from './utils'
import { segment } from './interfaces'

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
        console.log(res.data)
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
    'https://video-weaver.tyo01.hls.ttvnw.net/v1/playlist/CqEFU9l2eGzMEZvhOw3saqJ0GBiQSoyj33Htdok9erxN8lz9bKeT5GGUQIeQ4yyvHu5xGU7dAl1XBhd6nLcpMGJIWcyn1-IdkYXPZF0FXoUAi1BJgyTMyQL2Ki2qnZnQt_uJrE6xM1gc0MhHCBmgLhQhSyGTAitHF2JzmmIh5VLCi6HhuAt4GGILUaaMbVxDZ58yD9XQ8BGIwLMUrkn-NELHvoJZ8DjUMBtP0UGfZqJdg2xFEM4-pLBaEipZkToqDsP0HF9ROSdzqewcqLcde1aWYFxF_Hg0c2R7uJ0PyFGZ6iOV-Hprk8fqJfv5BajeNTdEphVAqE8Q6PeoDSAwUspQurtkVdf7yme58DQShnZ8CJOez8ti7kPq6N6SJlw9nad2I28E7E5ezOwUdXS9G2ByUDNg4Km9HNPIYBY38-BYceG19vOuGZfMGlLqBfHBIvScmD38u9tXKnxnZL0j5ympn6WvoGQz6lHC94dJbHkwNaehpvC_zWQp_O7xYcLeCaUIU6tQOBazgOh6P1CpXzVez8hKAKzzLmMHvxPeI5eGMqydx7MaXLnASgD72UcFMCZTGDmWA8SFraq0KLuibcj1GSI4J6qQYxxgk452NTnWiq7cJuUFk6YNLbspg4nHwVWtJjhIeYTzXBMIfdIJrzL_8eZJDmQaKfNVUONXx6PbJUDfvHIAW5d0pkgYGsHyp9WnORf_gM4cbuI9jGT0TEbH5hI-hQBKN5jjB9Ew-T2tlbSRg-Zf6L1s3M7mzx0SM3s8lPC5MpSs1kYbtbva7REK5SoOboHdWAB-eYTBJCPhvPXnD5302MMv3Dok577Bilievp9oj03dhV1uU5sttZeanf62Ht8GzUAdLwHedMp9HctdSGB3rIbl_IZcO2CPjM_GpRIQYWoJTdNQuUXYSknY9tmEGRoM3BoFW8FMwOfhQG1Y.m3u8'
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
