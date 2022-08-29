import { existsSync, promises as fs } from 'fs'
import { basename, dirname } from 'path'
import { extract } from 'tar'
import { executable } from '.'
import get from 'get-registry'
import axios from 'axios'

export async function download() {
  if (existsSync(executable)) return

  const registry = (await get()).replace(/\/$/, '')
  const cwd = dirname(executable)
  await fs.mkdir(cwd, { recursive: true })
  const name = `${process.platform}-${process.arch}`
  const { version } = require('../package.json')
  const url = `${registry}/@gocq/x-${name}/-/x-${name}-${version}.tgz`
  const { data: stream } = await axios.get<NodeJS.ReadableStream>(url, { responseType: 'stream' })

  await new Promise<void>((resolve, reject) => {
    stream.on('end', resolve)
    stream.on('error', reject)
    stream.pipe(extract({ cwd, newer: true }, [basename(executable)]))
  })
}
