import * as vscode from 'vscode'
import { BaseWebviewPanel, ValidatedMessage } from '../BaseWebviewPanel'

export class ColorConverterPanel extends BaseWebviewPanel {
  protected get messageWhitelist (): readonly string[] {
    return ['convertColor', 'copyToClipboard']
  }

  protected onMessage (message: ValidatedMessage): void {
    switch (message.command) {
    case 'convertColor':
      this._convertColor(message.color as string, message.fromFormat as string)
      return
    case 'copyToClipboard':
      void this._copyToClipboard(message.text as string)
      return
    }
  }

  private _convertColor (color: string, fromFormat: string): void {
    try {
      let rgb: { r: number, g: number, b: number }
      switch (fromFormat) {
      case 'hex':
        rgb = this._hexToRgb(color)
        break
      case 'rgb':
        rgb = this._parseRgb(color)
        break
      case 'hsl':
        rgb = this._hslToRgb(color)
        break
      default:
        throw new Error('Formato não suportado')
      }

      const hex = this._rgbToHex(rgb)
      const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
      const hsl = this._rgbToHsl(rgb)
      const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
      const hsv = this._rgbToHsv(rgb)
      const hsvStr = `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`

      void this.postMessage({
        command: 'colorConverted',
        result: {
          hex: hex,
          rgb: rgbStr,
          hsl: hslStr,
          hsv: hsvStr,
          rgbValues: rgb,
          hslValues: hsl,
          hsvValues: hsv
        },
        success: true
      })
    } catch (error) {
      console.error('Erro ao converter cor:', error)
      void this.postMessage({
        command: 'colorConverted',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      })
    }
  }

  private _hexToRgb (hex: string): { r: number, g: number, b: number } {
    const cleanHex = hex.replace('#', '')
    if (!/^[0-9A-F]{6}$/i.test(cleanHex)) {
      throw new Error('Formato HEX inválido. Use #RRGGBB')
    }
    const r = parseInt(cleanHex.slice(0, 2), 16)
    const g = parseInt(cleanHex.slice(2, 4), 16)
    const b = parseInt(cleanHex.slice(4, 6), 16)
    return { r, g, b }
  }

  private _rgbToHex (rgb: { r: number, g: number, b: number }): string {
    const toHex = (n: number): string => {
      const hex = Math.round(n).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase()
  }

  private _parseRgb (rgbStr: string): { r: number, g: number, b: number } {
    const match = rgbStr.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
    if (!match) {
      throw new Error('Formato RGB inválido. Use rgb(r, g, b)')
    }
    const r = parseInt(match[1])
    const g = parseInt(match[2])
    const b = parseInt(match[3])
    if (r > 255 || g > 255 || b > 255 || r < 0 || g < 0 || b < 0) {
      throw new Error('Valores RGB devem estar entre 0 e 255')
    }
    return { r, g, b }
  }

  private _hslToRgb (hslStr: string): { r: number, g: number, b: number } {
    const match = hslStr.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/)
    if (!match) {
      throw new Error('Formato HSL inválido. Use hsl(h, s%, l%)')
    }
    const h = parseInt(match[1]) / 360
    const s = parseInt(match[2]) / 100
    const l = parseInt(match[3]) / 100

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) { t += 1 }
      if (t > 1) { t -= 1 }
      if (t < 1 / 6) { return p + (q - p) * 6 * t }
      if (t < 1 / 2) { return q }
      if (t < 2 / 3) { return p + (q - p) * (2 / 3 - t) * 6 }
      return p
    }

    let r, g, b
    if (s === 0) {
      r = g = b = l
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    }
  }

  private _rgbToHsl (rgb: { r: number, g: number, b: number }): { h: number, s: number, l: number } {
    const r = rgb.r / 255
    const g = rgb.g / 255
    const b = rgb.b / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h, s
    const l = (max + min) / 2
    if (max === min) {
      h = s = 0
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
      default: h = 0
      }
      h /= 6
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }

  private _rgbToHsv (rgb: { r: number, g: number, b: number }): { h: number, s: number, v: number } {
    const r = rgb.r / 255
    const g = rgb.g / 255
    const b = rgb.b / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h, s
    const v = max
    const d = max - min
    s = max === 0 ? 0 : d / max
    if (max === min) {
      h = 0
    } else {
      switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
      default: h = 0
      }
      h /= 6
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      v: Math.round(v * 100)
    }
  }

  private async _copyToClipboard (text: string): Promise<void> {
    try {
      await vscode.env.clipboard.writeText(text)
      vscode.window.showInformationMessage('Cor copiada para a área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar cor:', error)
      vscode.window.showErrorMessage('Erro ao copiar cor para a área de transferência.')
    }
  }
}
