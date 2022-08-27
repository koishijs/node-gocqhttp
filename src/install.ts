import { components } from '@octokit/openapi-types'
import gocqhttp from '.'

export type Release = components['schemas']['release']

export const version = gocqhttp.version

export function getArch() {
  switch (process.arch) {
    // @ts-ignore
    case 'x32': return '386'
    case 'x64': return 'amd64'
    case 'arm64': return 'arm64'
    case 'arm': return 'armv7'
  }
  throw new Error(`Unsupported architecture: ${process.arch}`)
}

export function getPlatform() {
  switch (process.platform) {
    case 'darwin': return 'darwin'
    case 'linux': return 'linux'
    case 'win32': return 'windows'
  }
  throw new Error(`Unsupported platform: ${process.platform}`)
}
