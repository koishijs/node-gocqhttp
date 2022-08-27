import { extension, getArch, getPlatform, version } from '../src/install'
import { createWriteStream } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { extract } from 'tar'
import { join } from 'path'
import axios from 'axios'
import spawn from 'execa'

const matrix = [
  ['darwin', 'x64'],
  ['darwin', 'arm64'],
  ['linux', 'x32'],
  ['linux', 'x64'],
  ['linux', 'arm64'],
  ['linux', 'arm'],
  ['win32', 'x32'],
  ['win32', 'x64'],
  ['win32', 'arm64'],
  ['win32', 'arm'],
]

export async function download(platform: string, arch: string) {
  const cwd = join(__dirname, '../temp')

  const name = `go-cqhttp_${platform}_${arch}.${platform === 'win32' ? 'exe' : 'tar.gz'}`
  const url = `https://github.com/Mrs4s/go-cqhttp/releases/download/${version}/${name}`

  const [{ data: stream }] = await Promise.all([
    axios.get<NodeJS.ReadableStream>(url, { responseType: 'stream' }),
    mkdir(cwd, { recursive: true }),
  ])

  await new Promise<void>((resolve, reject) => {
    stream.on('end', resolve)
    stream.on('error', reject)
    if (platform === 'win32') {
      stream.pipe(createWriteStream(cwd + '/go-cqhttp.exe'))
    } else {
      stream.pipe(extract({ cwd, newer: true }, ['go-cqhttp']))
    }
  })

  await writeFile(join(cwd, 'index.js'), `module.exports = __dirname + '/go-cqhttp${extension}'`)
  await writeFile(join(cwd, 'package.json'), JSON.stringify({
    name: `@gocq/x-${platform}-${arch}`,
    version: require('../package.json').version,
    os: [getPlatform(platform)],
    cpu: [getArch(arch)],
  }, null, 2))

  spawn.sync('npm', ['publish'], { cwd, stdio: 'inherit' })
}

export async function start() {
  for (const [platform, arch] of matrix) {
    await download(platform, arch)
  }
}
