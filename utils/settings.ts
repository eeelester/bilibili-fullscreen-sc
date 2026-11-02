import { storage } from 'wxt/utils/storage'
import { DEFAULT_SIZE, PositionEnum, sizeEnum } from '@/constant'

export interface UiSettings {
  size: sizeEnum
  position: PositionEnum
}

export const DEFAULT_POSITION = PositionEnum.BOTTOM_LEFT

export function normalizeSize(value: unknown): sizeEnum {
  return Object.values(sizeEnum).includes(value as sizeEnum) ? value as sizeEnum : DEFAULT_SIZE
}

export function normalizePosition(value: unknown): PositionEnum {
  return Object.values(PositionEnum).includes(value as PositionEnum) ? value as PositionEnum : DEFAULT_POSITION
}

export async function getUiSettings(): Promise<UiSettings> {
  const [size, position] = await Promise.all([
    storage.getItem('local:UISize'),
    storage.getItem('local:UIPosition'),
  ])
  return { size: normalizeSize(size), position: normalizePosition(position) }
}

export function watchUiSettings(onSize: (size: sizeEnum) => void, onPosition: (position: PositionEnum) => void) {
  const unwatchSize = storage.watch('local:UISize', value => onSize(normalizeSize(value)))
  const unwatchPosition = storage.watch('local:UIPosition', value => onPosition(normalizePosition(value)))
  return () => {
    unwatchSize()
    unwatchPosition()
  }
}

export async function saveUiSize(size: sizeEnum) {
  await storage.setItem('local:UISize', size)
}

export async function saveUiPosition(position: PositionEnum) {
  await storage.setItem('local:UIPosition', position)
}
