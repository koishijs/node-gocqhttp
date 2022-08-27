import { extension, version } from '../src/install'
import { createWriteStream } from 'fs'
import { mkdir, rm, writeFile } from 'fs/promises'
import { extract } from 'tar'
import { join } from 'path'
import axios from 'axios'
import spawn from 'execa'

export function getArch(arch: string = process.arch) {
  switch (arch) {
    // @ts-ignore
    case 'x32': return '386'
    case 'x64': return 'amd64'
    case 'arm64': return 'arm64'
    case 'arm': return 'armv7'
  }
  throw new Error(`Unsupported architecture: ${arch}`)
}

export function getPlatform(platform: string = process.platform) {
  switch (platform) {
    case 'darwin': return 'darwin'
    case 'linux': return 'linux'
    case 'win32': return 'windows'
  }
  throw new Error(`Unsupported platform: ${platform}`)
}

type Target = [platform: string, arch: string]

const matrix: Target[] = [
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

export async function download(target: Target) {
  const cwd = join(__dirname, '../temp')
  await rm(cwd, { recursive: true, force: true })

  const platform = getPlatform(target[0])
  const arch = getArch(target[1])
  const name = `go-cqhttp_${platform}_${arch}.${target[0] === 'win32' ? 'exe' : 'tar.gz'}`
  const url = `https://github.com/Mrs4s/go-cqhttp/releases/download/${version}/${name}`

  console.log(`downloading from ${url}`)
  const [{ data: stream }] = await Promise.all([
    axios.get<NodeJS.ReadableStream>(url, { responseType: 'stream' }),
    mkdir(cwd, { recursive: true }),
  ])

  await new Promise<void>((resolve, reject) => {
    stream.on('end', resolve)
    stream.on('error', reject)
    if (target[0] === 'win32') {
      stream.pipe(createWriteStream(cwd + '/go-cqhttp.exe'))
    } else {
      stream.pipe(extract({ cwd, newer: true }, ['go-cqhttp']))
    }
  })

  await writeFile(join(cwd, 'index.js'), [
    `module.exports.filename = __dirname + '/go-cqhttp${extension}'`,
    `module.exports.version = '${version}'`,
  ].join('\n'))

  await writeFile(join(cwd, 'index.d.ts'), [
    `export const filename: string`,
    `export const version: string`,
  ].join('\n'))

  await writeFile(join(cwd, 'package.json'), JSON.stringify({
    name: `@gocq/x-${target[0]}-${target[1]}`,
    version: require('../package.json').version,
    main: 'index.js',
    types: 'index.d.ts',
    os: [platform],
    cpu: [arch],
  }, null, 2))

  spawn.sync('npm', ['publish', '--access', 'public'], { cwd, stdio: 'inherit' })
}

export async function start() {
  for (const target of matrix) {
    await download(target)
  }
}

if (require.main === module) {
  start()
}
