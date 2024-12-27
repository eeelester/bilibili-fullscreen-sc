export interface ScInfo {
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
  nodeRef: React.RefObject<HTMLDivElement | unknown>
  delay: number
  addedTime: number
}

export interface SCListProps {
  scDocument: Document
}
