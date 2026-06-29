import { app, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs'
import zlib from 'zlib'

function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeB = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcData = Buffer.concat([typeB, data])
  const crcB = Buffer.alloc(4)
  crcB.writeUInt32BE(crc32(crcData))
  return Buffer.concat([len, typeB, data, crcB])
}

function createPNG(size: number): Buffer {
  const raw = Buffer.alloc((1 + size * 4) * size)
  const center = size / 2
  const radius = size / 2 - 1

  for (let y = 0; y < size; y++) {
    const rowOff = y * (1 + size * 4)
    raw[rowOff] = 0
    for (let x = 0; x < size; x++) {
      const dx = x - center + 0.5
      const dy = y - center + 0.5
      const dist = Math.sqrt(dx * dx + dy * dy)
      const px = rowOff + 1 + x * 4
      if (dist <= radius) {
        raw[px] = 0x7c
        raw[px + 1] = 0x5c
        raw[px + 2] = 0xfc
        raw[px + 3] = 255
      }
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 })
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0))
  ])
}

let cachedPath: string | null = null

function getOrCreateIconPath(size: number): string {
  if (!cachedPath) {
    const dir = app.getPath('userData')
    const fileName = 'tray-icon-' + size + '.png'
    cachedPath = path.join(dir, fileName)
    if (!fs.existsSync(cachedPath)) {
      const png = createPNG(size)
      fs.writeFileSync(cachedPath, png)
    }
  }
  return cachedPath
}

export function getTrayIcon(): Electron.NativeImage {
  const size = process.platform === 'darwin' ? 16 : 22
  const iconPath = getOrCreateIconPath(size)
  return nativeImage.createFromPath(iconPath)
}
