const MIN_TEXT_CONTRAST_RATIO = 4.5
const DARK_FALLBACK_COLOR = '#333333'
const LIGHT_FALLBACK_COLOR = '#FFFFFF'

function getReadableTextColor(textColor: string, backgroundColor: string) {
  if (getContrastRatio(textColor, backgroundColor) >= MIN_TEXT_CONTRAST_RATIO)
    return textColor

  const darkContrastRatio = getContrastRatio(DARK_FALLBACK_COLOR, backgroundColor)
  const lightContrastRatio = getContrastRatio(LIGHT_FALLBACK_COLOR, backgroundColor)

  return darkContrastRatio >= lightContrastRatio ? DARK_FALLBACK_COLOR : LIGHT_FALLBACK_COLOR
}

function getContrastRatio(foregroundColor: string, backgroundColor: string) {
  const foregroundLuminance = getRelativeLuminance(foregroundColor)
  const backgroundLuminance = getRelativeLuminance(backgroundColor)

  if (foregroundLuminance === null || backgroundLuminance === null)
    return 0

  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

function getRelativeLuminance(color: string) {
  const rgb = parseHexColor(color)

  if (!rgb)
    return null

  const linearize = (channel: number) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  const [red, green, blue] = rgb

  return 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue)
}

function parseHexColor(color: string): [number, number, number] | null {
  const matchedHex = color.trim().match(/^#?([a-f\d]{3}|[a-f\d]{6})$/i)?.[1]

  if (!matchedHex)
    return null

  const hex = matchedHex.length === 3
    ? matchedHex.split('').map(char => char + char).join('')
    : matchedHex

  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ]
}

export { getReadableTextColor }
