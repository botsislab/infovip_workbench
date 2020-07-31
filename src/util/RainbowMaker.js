import * as palette from 'google-palette'

export default {

  getNextColor: function () {
    return this.colors[this.colorIndex++]
  },

  initColors: function () {
    var colors = []
    var hexColors = palette('tol', 10)
    var hexToRgb = this.hexToRgb
    hexColors.forEach(function (color) {
      colors.push(hexToRgb(color))
    })
    return colors
  },

  // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
  hexToRgb: function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  },

  decimalToHex (decimalColorComponent) {
    let hex = Math.floor(decimalColorComponent).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  },

  getLighter (hexColor, lighteningRatio) {
    let lightening = 255 * (lighteningRatio || 0.1)
    let parts = this.getRGBComponents(hexColor)
    parts.red = parts.red >= 255 - lightening ? 255 : parts.red + lightening
    parts.green = parts.green >= 255 - lightening ? 255 : parts.green + lightening
    parts.blue = parts.blue >= 255 - lightening ? 255 : parts.blue + lightening
    return this.componentsToHex(parts)
  },

  getDarker (hexColor, darkeningRatio) {
    let darkening = 255 * (darkeningRatio || 0.1)
    let parts = this.getRGBComponents(hexColor)
    parts.red = parts.red <= 0 + darkening ? 0 : parts.red - darkening
    parts.green = parts.green <= 0 + darkening ? 0 : parts.green - darkening
    parts.blue = parts.blue <= 0 + darkening ? 0 : parts.blue - darkening
    return this.componentsToHex(parts)
  },

  getGrayer (hexColor, grayingRatio) {
    let graying = grayingRatio || 0.1
    let parts = this.getRGBComponents(hexColor)
    let maxComponent = Math.max(parts.red, parts.green, parts.blue)
    // Move non-max components closer to maxComponent
    if (maxComponent !== parts.red) {
      parts.red = parts.red + (maxComponent - parts.red) * graying
    }
    if (maxComponent !== parts.green) {
      parts.green = parts.green + (maxComponent - parts.green) * graying
    }
    if (maxComponent !== parts.blue) {
      parts.blue = parts.blue + (maxComponent - parts.blue) * graying
    }
    return this.componentsToHex(parts)
  },

  componentsToHex (colorComponents) {
    return '#' + this.decimalToHex(colorComponents.red) + this.decimalToHex(colorComponents.green) + this.decimalToHex(colorComponents.blue)
  },

  getRGBComponents (hexColor) {
    let hex = hexColor.replace('#', '')
    return {
      red: parseInt(hex.slice(0, 2), 16),
      green: parseInt(hex.slice(2, 4), 16),
      blue: parseInt(hex.slice(4, 6), 16)
    }
  }
}
