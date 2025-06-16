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
   */  private _processAnsiText (text: string, options: { stripAnsi: boolean, renderAnsi: boolean, highlightAnsi: boolean }) {
    try {
      console.log('Recebido texto para processamento:', { 
        textLength: text.length, 
        options: options 
      })
      
      let result = text      // Define the ANSI escape code pattern (ESC[ followed by parameters and a command character)
      // Inclui o caractere � que aparece em alguns logs quando o ESC é mal codificado
      const ansiPattern = /(?:\u001b|\x1b|�)\[[0-9;]*[A-Za-z]/g

      if (options.stripAnsi) {
        // Strip all ANSI codes
        result = text.replace(ansiPattern, '')
        this._sendProcessedResult(this._escapeHtml(result))
      } else if (options.renderAnsi) {
        // Render ANSI codes as HTML
        result = this._renderAnsiAsHtml(text)
        this._sendProcessedResult(result)
      } else if (options.highlightAnsi) {
        // Highlight ANSI codes (make them visible)
        result = this._escapeHtml(text).replace(ansiPattern, (match) => {
          return `<span style="background-color:yellow;color:black;font-weight:bold;">${match}</span>`
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
   */  private _renderAnsiAsHtml (text: string): string {
    console.log('Renderizando ANSI como HTML')
    
    // Basic mapping of ANSI codes to CSS styles
    const styleMap: Record<string, string> = {
      '0': '</span>',  // Reset
      '1': '<span style="font-weight:bold;">',  // Bold
      '2': '<span style="opacity:0.7;">',  // Dim
      '3': '<span style="font-style:italic;">',  // Italic
      '4': '<span style="text-decoration:underline;">',  // Underline
      '5': '<span style="animation:blink 1s step-start 0s infinite;">',  // Blink
      '7': '<span style="filter:invert(100%);">',  // Reverse
      '8': '<span style="visibility:hidden;">',  // Hidden
      '9': '<span style="text-decoration:line-through;">',  // Strikethrough
      // Foreground colors
      '30': '<span style="color:black;">',  // Black
      '31': '<span style="color:#ff0000;">',  // Red (mais brilhante)
      '32': '<span style="color:#00ff00;">',  // Green (mais brilhante)
      '33': '<span style="color:#ffff00;">',  // Yellow (mais brilhante)
      '34': '<span style="color:#0080ff;">',  // Blue (mais brilhante)
      '35': '<span style="color:#ff00ff;">',  // Magenta (mais brilhante)
      '36': '<span style="color:#00ffff;">',  // Cyan (mais brilhante)
      '37': '<span style="color:white;">',  // White
      '39': '<span style="color:inherit;">',  // Default color
      
      // Background colors
      '40': '<span style="background-color:black;">',  // Black
      '41': '<span style="background-color:red;">',  // Red
      '42': '<span style="background-color:green;">',  // Green
      '43': '<span style="background-color:yellow;">',  // Yellow
      '44': '<span style="background-color:blue;">',  // Blue
      '45': '<span style="background-color:magenta;">',  // Magenta
      '46': '<span style="background-color:cyan;">',  // Cyan
      '47': '<span style="background-color:white;">',  // White
      '49': '<span style="background-color:inherit;">'  // Default background
    }

    // Bright foreground colors
    for (let i = 0; i < 8; i++) {
      styleMap[`9${i}`] = `<span style="color:var(--vscode-terminal-ansi${i}Bright,var(--vscode-terminal-ansi${i}));">`
    }

    // Bright background colors
    for (let i = 0; i < 8; i++) {
      styleMap[`10${i}`] = `<span style="background-color:var(--vscode-terminal-ansi${i}Bright,var(--vscode-terminal-ansi${i}));">`
    }

    // Escape HTML in text
    let html = this._escapeHtml(text)    // Stack to keep track of open spans
    const openSpans: string[] = []
    
    // Replace ANSI escape sequences with HTML
    html = html.replace(/(?:\u001b|\x1b|�)\[([0-9;]*)m/g, (match, params) => {
      // Split parameters
      const paramList = params.split(';')
      
      // Reset closes all open spans
      if (params === '0' || params === '') {
        const result = openSpans.length > 0 ? '</span>'.repeat(openSpans.length) : ''
        openSpans.length = 0
        return result
      }
      
      let result = ''
      
      // Process each parameter
      for (const param of paramList) {
        if (styleMap[param]) {
          if (param === '0') {
            // Reset
            result += '</span>'.repeat(openSpans.length)
            openSpans.length = 0          } else if (param.startsWith('0')) {
            // Reset specific formatting
            // This is simplified; would need more complex logic for actual implementation
            result += '</span>'
          } else {
            // Add style
            result += styleMap[param]
            openSpans.push(param)
          }
        }
      }
      
      return result
    })
    
    // Close any remaining open spans
    html += openSpans.length > 0 ? '</span>'.repeat(openSpans.length) : ''
    
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
