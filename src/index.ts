import { dirname, resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { spawn, SpawnOptions } from 'child_process'
import env from 'env-paths'

function gocq(options: gocq.Options = {}) {
  const args = ['-faststart']
  if (!existsSync(gocq.binary)) {
    mkdirSync(dirname(gocq.binary), { recursive: true })
    copyFileSync(gocq.backup, gocq.binary)
  }
  return spawn(gocq.binary, args, {
    env: {
      FORCE_TTY: '1',
      ...process.env,
      ...options.env,
    },
    ...options,
  })
}

namespace gocq {
  export interface Options extends SpawnOptions {}

  export const version = '0312f05'
  export const runId = 4419078704
  export const basename = 'go-cqhttp' + (process.platform === 'win32' ? '.exe' : '')
  export const binary = resolve(env('gocqhttp').data, version, basename)
  export const backup = resolve(__dirname, '../bin', basename)
}

export = gocq
