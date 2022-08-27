import { version } from '../src/install'
import { createWriteStream } from 'fs'
import { mkdir } from 'fs/promises'
import { extract } from 'tar'
import { join } from 'path'
import axios from 'axios'

const matrix = [
  ['darwin', 'amd64'],
  ['darwin', 'arm64'],
  ['linux', '386'],
  ['linux', 'amd64'],
  ['linux', 'arm64'],
  ['linux', 'armv7'],
  ['windows', '386'],
  ['windows', 'amd64'],
  ['windows', 'arm64'],
  ['windows', 'armv7'],
]

export async function download(platform: string, arch: string) {
  const outDir = join(__dirname, '../bin')

  const name = `go-cqhttp_${platform}_${arch}.${platform === 'windows' ? 'exe' : 'tar.gz'}`
  const url = `https://github.com/Mrs4s/go-cqhttp/releases/download/${version}/${name}`

  const [{ data: stream }] = await Promise.all([
    axios.get<NodeJS.ReadableStream>(url, { responseType: 'stream' }),
    mkdir(outDir, { recursive: true }),
  ])

  return await new Promise<void>((resolve, reject) => {
    stream.on('end', resolve)
    stream.on('error', reject)
    if (platform === 'windows') {
      stream.pipe(createWriteStream(outDir + '/go-cqhttp'))
    } else {
      stream.pipe(extract({ cwd: outDir, newer: true }, ['go-cqhttp']))
    }
  })
}

export async function start() {
  for (const [platform, arch] of matrix) {
    await download(platform, arch)
  }
}
