import * as vscode from 'vscode'
import { BaseWebviewPanel, ValidatedMessage } from '../BaseWebviewPanel'

interface AnsiOptions {
  stripAnsi: boolean
  renderAnsi: boolean
  highlightAnsi: boolean
}

export class AnsiFormatterPanel extends BaseWebviewPanel {
  protected get messageWhitelist (): readonly string[] {
    return ['processAnsi', 'copyToClipboard']
  }

  protected onMessage (message: ValidatedMessage): void {
    switch (message.command) {
    case 'processAnsi':
      this._processAnsiText(message.text as string, message.options as AnsiOptions)
      return
    case 'copyToClipboard':
      void this._copyToClipboard(message.text as string)
      return
    }
  }

  private _processAnsiText (text: string, options: AnsiOptions): void {
    try {
      const ansiPattern = /(?:\u001b\[|\x1b\[|\[)([0-9;]*)m/g
      if (options.stripAnsi) {
        const result = text.replace(ansiPattern, '')
        this._sendProcessedResult(this._escapeHtml(result))
      } else if (options.renderAnsi) {
        this._sendProcessedResult(this._renderAnsiAsHtml(text))
      } else if (options.highlightAnsi) {
        const result = this._escapeHtml(text).replace(ansiPattern, (match) => {
          return `<span style="background-color:yellow;color:black;font-weight:bold;">${this._escapeHtml(match)}</span>`
        })
        this._sendProcessedResult(result)
      } else {
        this._sendProcessedResult(this._escapeHtml(text))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      void this.postMessage({
        command: 'processed',
        error: `Erro ao processar o texto: ${errorMessage}`,
        success: false
      })
    }
  }

  private _renderAnsiAsHtml (text: string): string {
    let html = this._escapeHtml(text)
    const styleMap: Record<string, string> = {
      0: 'RESET',
      1: 'font-weight:bold;',
      2: 'opacity:0.7;',
      3: 'font-style:italic;',
      4: 'text-decoration:underline;',
      5: 'animation:blink 1s step-start 0s infinite;',
      7: 'filter:invert(100%);',
      8: 'visibility:hidden;',
      9: 'text-decoration:line-through;',
      30: 'color:#000000;',
      31: 'color:#cd3131;',
      32: 'color:#00bc00;',
      33: 'color:#e5e510;',
      34: 'color:#2472c8;',
      35: 'color:#bc3fbc;',
      36: 'color:#11a8cd;',
      37: 'color:#e5e5e5;',
      39: 'color:inherit;',
      40: 'background-color:#000000;',
      41: 'background-color:#cd3131;',
      42: 'background-color:#00bc00;',
      43: 'background-color:#e5e510;',
      44: 'background-color:#2472c8;',
      45: 'background-color:#bc3fbc;',
      46: 'background-color:#11a8cd;',
      47: 'background-color:#e5e5e5;',
      49: 'background-color:inherit;',
      90: 'color:#666666;',
      91: 'color:#f14c4c;',
      92: 'color:#23d18b;',
      93: 'color:#f5f543;',
      94: 'color:#3b8eea;',
      95: 'color:#d670d6;',
      96: 'color:#29b8db;',
      97: 'color:#e5e5e5;',
      100: 'background-color:#666666;',
      101: 'background-color:#f14c4c;',
      102: 'background-color:#23d18b;',
      103: 'background-color:#f5f543;',
      104: 'background-color:#3b8eea;',
      105: 'background-color:#d670d6;',
      106: 'background-color:#29b8db;',
      107: 'background-color:#e5e5e5;'
    }

    const styleStack: string[] = []
    html = html.replace(/\[([0-9;]*)m/g, (match, params) => {
      if (!params || params === '0') {
        const closeSpans = '</span>'.repeat(styleStack.length)
        styleStack.length = 0
        return closeSpans
      }
      const paramList = params.split(';').filter((p: string) => p !== '')
      let result = ''
      for (const param of paramList) {
        if (styleMap[param]) {
          if (styleMap[param] === 'RESET') {
            result += '</span>'.repeat(styleStack.length)
            styleStack.length = 0
          } else {
            result += `<span style="${styleMap[param]}">`
            styleStack.push(param)
          }
        }
      }
      return result
    })

    html += '</span>'.repeat(styleStack.length)
    return html
  }

  private _escapeHtml (text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  private _sendProcessedResult (result: string): void {
    void this.postMessage({ command: 'processed', result: result, success: true })
  }

  private async _copyToClipboard (text: string): Promise<void> {
    try {
      await vscode.env.clipboard.writeText(text)
      vscode.window.showInformationMessage('Texto copiado para a área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar texto:', error)
      vscode.window.showErrorMessage('Erro ao copiar texto para a área de transferência.')
    }
  }
}
