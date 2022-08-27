import env from 'env-paths'
import { join } from 'path'
import { spawn, SpawnOptions } from 'child_process'

function gocq(options: gocq.Options = {}) {
  const args: string[] = []
  if (options.faststart) args.push('-faststart')
  return spawn(gocq.executable, options)
}

namespace gocq {
  export const version = 'v1.0.0-rc3'

  export interface Options extends SpawnOptions {
    faststart?: boolean
  }

  export const extension = process.platform === 'win32' ? '.exe' : ''
  export const executable = join(env('gocqhttp').data, version, 'go-cqhttp' + extension)
}

export = gocq
