import type { RefObject } from 'react'
import type { UiSettings } from '@/utils/settings'

export interface ScMessage {
  face: string
  face_frame: string
  uname: string
  name_color: string
  price: number
  message: string
  message_font_color: string
  background_bottom_color: string
  background_color: string
  id: number
  time: number
  delay: number
}

export interface ScInfo extends ScMessage {
  nodeRef: RefObject<HTMLDivElement>
  addedTime: number
}

export interface SCListProps {
  scDocument?: Document
  onReady?: () => void
  uiSettings?: UiSettings
  preview?: boolean
}
