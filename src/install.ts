import { existsSync, promises as fs } from 'fs'
import { dirname, join, resolve } from 'path'
import { extract } from 'tar'
import { basename, binary } from '.'
import get from 'get-registry'
import axios from 'axios'
import internal from 'stream'

const cwd = resolve(__dirname, '../bin')
const backup = join(cwd, basename)

export async function download() {
  const registry = (await get()).replace(/\/$/, '')
  await fs.mkdir(cwd, { recursive: true })
  const name = `${process.platform}-${process.arch}`
  const { version } = require('../package.json')
  const url = `${registry}/@gocq/x-${name}/-/x-${name}-${version}.tgz`
  const { data: readable } = await axios.get<internal.Readable>(url, { responseType: 'stream' })

  const writable = extract({ cwd, newer: true, strip: 1 }, ['package/' + basename])
  await new Promise<void>((resolve, reject) => {
    writable.on('close', resolve)
    writable.on('error', reject)
    readable.on('error', reject)
    readable.pipe(writable)
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
