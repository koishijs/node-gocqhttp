import { operations } from '@octokit/openapi-types'
import { basename, runId, version } from '../src'
import { createWriteStream } from 'fs'
import { mkdir, rm, writeFile } from 'fs/promises'
import { execSync } from 'child_process'
import { extract } from 'tar'
import { join } from 'path'
import AdmZip from 'adm-zip'
import axios from 'axios'

type ArtifactResult = operations['actions/list-workflow-run-artifacts']['responses'][200]['content']['application/json']

export function getArch(arch: string = process.arch) {
  switch (arch) {
    case 'ia32': return '386'
    case 'x64': return 'amd64'
    case 'arm64': return 'arm64'
    case 'arm': return 'arm'
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
  ['linux', 'ia32'],
  ['linux', 'x64'],
  ['linux', 'arm64'],
  ['linux', 'arm'],
  ['win32', 'ia32'],
  ['win32', 'x64'],
  ['win32', 'arm64'],
  ['win32', 'arm'],
]

function once<S extends unknown[], T>(callback: (...args: S) => Promise<T>) {
  let task: Promise<T> | null = null
  return (...args: S) => (task ??= callback(...args))
}

const getArtifacts = once(async (runId: number) => {
  const { data } = await axios.get<ArtifactResult>(`https://api.github.com/repos/Mrs4s/go-cqhttp/actions/runs/${runId}/artifacts`)
  return data.artifacts
})

async function downloadRelease(cwd: string, platform: string, arch: string) {
  const filename = `go-cqhttp_${platform}_${arch}.${platform === 'windows' ? 'exe' : 'tar.gz'}`
  const url = `https://github.com/Mrs4s/go-cqhttp/releases/download/${version}/${filename}`

  console.log(`downloading from ${url}`)
  const [{ data: stream }] = await Promise.all([
    axios.get<NodeJS.ReadableStream>(url, { responseType: 'stream' }),
    mkdir(cwd, { recursive: true }),
  ])

  return new Promise<void>((resolve, reject) => {
    stream.on('end', resolve)
    stream.on('error', reject)
    if (url.endsWith('.exe')) {
      stream.pipe(createWriteStream(cwd + '/go-cqhttp.exe'))
    } else {
      stream.pipe(extract({ cwd, newer: true }, ['go-cqhttp']))
    }
  })
}

async function downloadArtifact(cwd: string, platform: string, arch: string) {
  const artifacts = await getArtifacts(runId)
  const url = artifacts.find((artifact) => {
    return artifact.name === `${platform}_${arch}`
  })!.archive_download_url

  console.log(`downloading from ${url}`)
  const [{ data }] = await Promise.all([
    axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      headers: {
        Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
      },
    }),
    mkdir(cwd, { recursive: true }),
  ])
  const adm = new AdmZip(Buffer.from(data))
  const extension = platform === 'windows' ? '.exe' : ''
  const dest = `${cwd}/go-cqhttp${extension}`
  adm.extractEntryTo(`go-cqhttp_${platform}_${arch}${extension}`, dest, false)
}

export async function build(target: Target) {
  const cwd = join(__dirname, '../temp')
  await rm(cwd, { recursive: true, force: true })

  const platform = getPlatform(target[0])
  const arch = getArch(target[1])
  if (version.startsWith('v')) {
    await downloadRelease(cwd, platform, arch)
  } else {
    await downloadArtifact(cwd, platform, arch)
  }

  await writeFile(join(cwd, 'index.js'), [
    `module.exports.filename = __dirname + '/${basename}'`,
    `module.exports.version = '${version}'`,
  ].join('\n'))

  await writeFile(join(cwd, 'index.d.ts'), [
    `export const filename: string`,
    `export const version: string`,
  ].join('\n'))

  const name = `@gocq/x-${target[0]}-${target[1]}`
  await writeFile(join(cwd, 'package.json'), JSON.stringify({
    name,
    version: require('../package.json').version,
    main: 'index.js',
    types: 'index.d.ts',
    os: [platform],
    cpu: [arch],
  }, null, 2))

  execSync(['npm', 'publish', '--access', 'public'].join(' '), { cwd, stdio: 'inherit' })
  await axios.put('https://registry-direct.npmmirror.com/' + name + '/sync?sync_upstream=true')
}

export async function start() {
  for (const target of matrix) {
    console.log(`building ${target.join('-')}`)
    await build(target)
  }
}

if (require.main === module) {
  start()
}
