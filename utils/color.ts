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

  const [red, green, blue] = rgb.map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function parseHexColor(color: string) {
  const match = color.trim().match(/^#?([a-f\d]{3}|[a-f\d]{6})$/i)

  if (!match)
    return null

  const hex = match[1].length === 3
    ? match[1].split('').map(char => char + char).join('')
    : match[1]

  return [0, 2, 4].map(index => Number.parseInt(hex.slice(index, index + 2), 16))
}

export { getReadableTextColor }
