import { Parser } from 'm3u8-parser'
import * as fs from 'fs'
import axios from 'axios'
import { sleep } from './../../utils'
import { segment } from './../../interfaces'
import { Decoder } from 'ts-coder'

export class Hls {
  m3u8url: string
  //tsファイルのファイル指定が相対パスのときに必要
  baseurl: string
  parser = new Parser()
  decoder = new Decoder({
    headSize: 4,
    isEnd(head) {
      return head[0] === 0x02
    },
  })
  picsnum = 0
  currentMediaSequence: number
  resolved: Array<segment>

  /**
   *
   * @param m3u8url m3u8のurl
   * @param baseUrl tsファイルが相対パスだった場合に必要
   */
  constructor(m3u8url: string, baseUrl?: string) {
    this.m3u8url = m3u8url
    if (typeof baseUrl !== 'undefined') {
      this.baseurl = baseUrl
    }
    this.decoder.onData((buffer) => {
      console.log(buffer)
      const arrayBuffed = new Uint8Array(buffer)
      fs.writeFileSync(`test${this.picsnum}.jpg`, arrayBuffed)
      this.picsnum++
    })
  }

  deleteDuplication(segments: Array<segment>): Array<segment> {
    const removed: Array<segment> = []
    for (const index in segments) {
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

  parseTsFile(tsFile: ArrayBuffer): void {
    this.decoder.push(Buffer.from(tsFile))
  }

  async getTsFiles(segments: Array<segment>): Promise<void> {
    //console.log(this.segments)
    for (const segment of segments) {
      //console.log(segments)
      const url = this.baseurl + segment.uri
      //console.log(url)
      try {
        const res = await axios.get(url, {
          responseType: 'arraybuffer',
          headers: { 'content-Type': 'video/mp2t' },
        })
        //console.log(segment.uri)
        this.parseTsFile(res.data)
      } catch (err) {
        console.error(err)
      }
    }
  }

  removeResolved(segments: Array<segment>): Array<segment> {
    const removed: Array<segment> = []
    for (const index in segments) {
      if (!(segments[index] === this.resolved[index])) {
        removed.push(segments[index])
      }
    }
    return removed
  }

  loadm3u8(): void {
    axios
      .get<string>(this.m3u8url, {
        headers: { 'content-Type': 'application/vnd.apple.mpegurl' },
      })
      .then((res) => {
        this.parser.push(res.data)
        const segments = this.parser.manifest.segments
        //console.log(this.parser.manifest.mediaSequence)
        //console.log(segments)
        if (this.parser.manifest.mediaSequence > this.currentMediaSequence) {
          this.getTsFiles(segments)
        } else if (typeof this.currentMediaSequence === 'undefined') {
          console.log(this.currentMediaSequence)
          this.getTsFiles(segments)
        }
        this.currentMediaSequence = this.parser.manifest.mediaSequence
        sleep(this.parser.manifest.targetDuration)
        //this.loadm3u8()
      })
      .catch((err) => console.log(err))
  }
}
