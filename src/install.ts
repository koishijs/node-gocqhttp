import { existsSync, promises as fs } from 'fs'
import { dirname, join } from 'path'
import { extract } from 'tar'
import { basename, binary, version } from '.'
import get from 'get-registry'
import axios from 'axios'
import env from 'env-paths'

const cwd = join(env('gocqhttp').data, version)
const backup = join(cwd, basename)

export async function download() {
  const registry = (await get()).replace(/\/$/, '')
  await fs.mkdir(cwd, { recursive: true })
  const name = `${process.platform}-${process.arch}`
  const { version } = require('../package.json')
  const url = `${registry}/@gocq/x-${name}/-/x-${name}-${version}.tgz`
  const { data: stream } = await axios.get<NodeJS.ReadableStream>(url, { responseType: 'stream' })

  await new Promise<void>((resolve, reject) => {
    stream.on('end', resolve)
    stream.on('error', reject)
    stream.pipe(extract({ cwd, newer: true, strip: 1 }, ['package/' + basename]))
  })
}

export async function install() {
  if (existsSync(binary)) return
  if (!existsSync(backup)) {
    await download()
  }
  await fs.mkdir(dirname(binary), { recursive: true })
  await fs.copyFile(backup, binary)
}
