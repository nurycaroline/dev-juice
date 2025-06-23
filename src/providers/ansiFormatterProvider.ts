import * as vscode from 'vscode'
import { loadTemplate } from '../utils/templateLoader'

/**
 * Provider for the ANSI log formatter webview panel
 */
export class AnsiFormatterProvider {  /**
   * Track the currently active panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: AnsiFormatterProvider | undefined

  public static readonly viewType = 'ansiFormatter'

  private readonly _panel: vscode.WebviewPanel
  private readonly _extensionUri: vscode.Uri
  private readonly _disposables: vscode.Disposable[] = []

  public static createOrShow (extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it.
    if (AnsiFormatterProvider.currentPanel) {
      AnsiFormatterProvider.currentPanel._panel.reveal(column)
      return
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      AnsiFormatterProvider.viewType,
      'Formatador de Logs ANSI',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'src', 'templates')
        ]
      }
    )

    AnsiFormatterProvider.currentPanel = new AnsiFormatterProvider(panel, extensionUri)
  }
  private constructor (panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel
    this._extensionUri = extensionUri

    // Set the webview's initial html content
    this._update()
    
    console.log('Inicializando AnsiFormatterProvider')

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)// Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        console.log('Mensagem recebida do webview:', message)
        
        switch (message.command) {
        case 'processAnsi':
          this._processAnsiText(message.text, message.options)
          return
        case 'copyToClipboard':
          this._copyToClipboard(message.text)
          return
        }
      },
      null,
      this._disposables
    )
  }
  /**
   * Process text containing ANSI codes
   */
  private _processAnsiText (text: string, options: { stripAnsi: boolean, renderAnsi: boolean, highlightAnsi: boolean }) {
    try {
      console.log('Recebido texto para processamento:', { 
        textLength: text.length, 
        options: options 
      })
      
      let result = text      // Define the ANSI escape code pattern - mais abrangente para capturar todos os códigos
      // Inclui códigos completos (ESC[) e códigos truncados ([0m, [32m, etc.)
      const ansiPattern = /(?:\u001b\[|\x1b\[|\[)([0-9;]*)m/g

      if (options.stripAnsi) {
        // Strip all ANSI codes        result = text.replace(ansiPattern, '')
        this._sendProcessedResult(this._escapeHtml(result))
      } else if (options.renderAnsi) {
        // Render ANSI codes as HTML
        result = this._renderAnsiAsHtml(text)
        this._sendProcessedResult(result)
      } else if (options.highlightAnsi) {
        // Highlight ANSI codes (make them visible)
        result = this._escapeHtml(text).replace(ansiPattern, (match) => {
          return `<span style="background-color:yellow;color:black;font-weight:bold;">${this._escapeHtml(match)}</span>`
        })
        this._sendProcessedResult(result)
      } else {
        // Default: just escape HTML
        this._sendProcessedResult(this._escapeHtml(text))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      this._panel.webview.postMessage({
        command: 'processed',
        error: `Erro ao processar o texto: ${errorMessage}`,
        success: false
      })
    }
  }
  /**
   * Convert ANSI escape codes to HTML styling
   */
  private _renderAnsiAsHtml (text: string): string {
    console.log('Renderizando ANSI como HTML')
    
    // Escape HTML in text first
    let html = this._escapeHtml(text)
    
    // Enhanced ANSI style mapping with better colors
    const styleMap: Record<string, string> = {
      // Reset
      '0': 'RESET',
      
      // Text styling
      '1': 'font-weight:bold;',
      '2': 'opacity:0.7;',
      '3': 'font-style:italic;',
      '4': 'text-decoration:underline;',
      '5': 'animation:blink 1s step-start 0s infinite;',
      '7': 'filter:invert(100%);',
      '8': 'visibility:hidden;',
      '9': 'text-decoration:line-through;',
      
      // Foreground colors (normal)
      '30': 'color:#000000;',  // Black
      '31': 'color:#cd3131;',  // Red
      '32': 'color:#00bc00;',  // Green
      '33': 'color:#e5e510;',  // Yellow
      '34': 'color:#2472c8;',  // Blue
      '35': 'color:#bc3fbc;',  // Magenta
      '36': 'color:#11a8cd;',  // Cyan
      '37': 'color:#e5e5e5;',  // White
      '39': 'color:inherit;',  // Default
      
      // Background colors (normal)
      '40': 'background-color:#000000;',  // Black
      '41': 'background-color:#cd3131;',  // Red
      '42': 'background-color:#00bc00;',  // Green
      '43': 'background-color:#e5e510;',  // Yellow
      '44': 'background-color:#2472c8;',  // Blue
      '45': 'background-color:#bc3fbc;',  // Magenta
      '46': 'background-color:#11a8cd;',  // Cyan
      '47': 'background-color:#e5e5e5;',  // White
      '49': 'background-color:inherit;',  // Default
      
      // Bright foreground colors
      '90': 'color:#666666;',  // Bright Black (Dark Grey)
      '91': 'color:#f14c4c;',  // Bright Red
      '92': 'color:#23d18b;',  // Bright Green
      '93': 'color:#f5f543;',  // Bright Yellow
      '94': 'color:#3b8eea;',  // Bright Blue
      '95': 'color:#d670d6;',  // Bright Magenta
      '96': 'color:#29b8db;',  // Bright Cyan
      '97': 'color:#e5e5e5;',  // Bright White
      
      // Bright background colors
      '100': 'background-color:#666666;',  // Bright Black
      '101': 'background-color:#f14c4c;',  // Bright Red
      '102': 'background-color:#23d18b;',  // Bright Green
      '103': 'background-color:#f5f543;',  // Bright Yellow
      '104': 'background-color:#3b8eea;',  // Bright Blue
      '105': 'background-color:#d670d6;',  // Bright Magenta
      '106': 'background-color:#29b8db;',  // Bright Cyan
      '107': 'background-color:#e5e5e5;'   // Bright White
    }
    
    // Stack to manage nested styles
    const styleStack: string[] = []
    
    // Replace ANSI escape sequences with HTML
    html = html.replace(/\[([0-9;]*)m/g, (match, params) => {
      if (!params || params === '0') {
        // Reset - close all open spans
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
    
    // Close any remaining open spans
    html += '</span>'.repeat(styleStack.length)
    
    return html
  }

  /**
   * Escape HTML special characters
   */
  private _escapeHtml (text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  /**
   * Send processed result back to webview
   */  private _sendProcessedResult (result: string) {
    console.log('Enviando resultado processado para o webview')
    try {
      this._panel.webview.postMessage({
        command: 'processed',
        result: result,
        success: true
      })
    } catch (error) {
      console.error('Erro ao enviar mensagem para o webview:', error)
    }
  }

  /**
   * Copies text to clipboard
   */
  private async _copyToClipboard (text: string) {
    try {
      await vscode.env.clipboard.writeText(text)
      vscode.window.showInformationMessage('Texto copiado para a área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar texto:', error)
      vscode.window.showErrorMessage('Erro ao copiar texto para a área de transferência.')
    }
  }

  public dispose () {
    AnsiFormatterProvider.currentPanel = undefined

    // Clean up our resources
    this._panel.dispose()

    while (this._disposables.length) {
      const x = this._disposables.pop()
      if (x) {
        x.dispose()
      }
    }
  }

  private _update () {
    this._panel.webview.html = this._getHtmlForWebview()
  } 
  
  private _getHtmlForWebview () {
    return loadTemplate(this._extensionUri, 'ansi-formatter')
  }
}
