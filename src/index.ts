import { join } from 'path'
import { spawn, SpawnOptions } from 'child_process'
import env from 'env-paths'

function gocq(options: gocq.Options = {}) {
  const args: string[] = []
  if (options.faststart) args.push('-faststart')
  return spawn(gocq.binary, args, options)
}

namespace gocq {
  export interface Options extends SpawnOptions {
    faststart?: boolean
  }

  export const version = 'v1.0.0-rc4'
  export const basename = 'go-cqhttp' + (process.platform === 'win32' ? '.exe' : '')
  export const binary = join(env('gocqhttp').data, version, basename)
}

export = gocq
