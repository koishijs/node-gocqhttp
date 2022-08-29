import env from 'env-paths'
import { resolve } from 'path'
import { existsSync } from 'fs'
import { spawn, SpawnOptions } from 'child_process'

function gocq(options: gocq.Options = {}) {
  const args: string[] = []
  if (options.faststart) args.push('-faststart')
  const local = gocq.local()
  const executable = existsSync(local) ? local : gocq.shared()
  return spawn(executable, options)
}

namespace gocq {
  export const version = 'v1.0.0-rc3'

  export interface Options extends SpawnOptions {
    faststart?: boolean
  }

  export const extension = process.platform === 'win32' ? '.exe' : ''
  export const local = () => resolve(__dirname, '../bin', 'go-cqhttp' + extension)
  export const shared = () => resolve(env('gocqhttp').data, version, 'go-cqhttp' + extension)
}

export = gocq
