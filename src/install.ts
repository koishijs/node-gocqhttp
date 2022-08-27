import { components } from '@octokit/openapi-types'
import gocqhttp from '.'

export type Release = components['schemas']['release']

export const extension = gocqhttp.extension
export const version = gocqhttp.version

export function getArch(arch: string = process.arch) {
  switch (arch) {
    // @ts-ignore
    case 'x32': return '386'
    case 'x64': return 'amd64'
    case 'arm64': return 'arm64'
    case 'arm': return 'armv7'
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
