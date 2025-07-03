import { Buffer } from 'buffer'
import type { Buffer as BufferType } from 'buffer'
import { BrotliDecode } from './brotli'
import { inflate } from 'pako'

const inflateAsync = (d: BufferType) => Buffer.from(inflate(new Uint8Array(d)))
const brotliDecompressAsync = (d: BufferType) => Buffer.from(Uint8Array.from(BrotliDecode(Int8Array.from(d))))

export const inflates = { inflateAsync, brotliDecompressAsync, Buffer }


