import { resolve } from 'path'
import { spawn, SpawnOptions } from 'child_process'

function gocq(options: gocq.Options = {}) {
  const args: string[] = []
  if (options.faststart) args.push('-faststart')
  return spawn(gocq.binary, args, options)
}

namespace gocq {
  export const version = 'v1.0.0-rc3'

  export interface Options extends SpawnOptions {
    faststart?: boolean
  }

  export const basename = 'go-cqhttp' + (process.platform === 'win32' ? '.exe' : '')
  export const binary = resolve(__dirname, '../bin', basename)
}

export = gocq
