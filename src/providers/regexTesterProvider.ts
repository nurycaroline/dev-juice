import * as vscode from 'vscode'
import { insertText } from '../utils/insertUtils'
import { loadTemplate } from '../utils/templateLoader'

interface MatchResult {
  match: string
  index: number
  groups: string[]
  namedGroups: Record<string, string>
  line?: number
}

export class RegexTesterProvider {
  private static currentPanel: vscode.WebviewPanel | undefined

  public static createOrShow (extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it.
    if (RegexTesterProvider.currentPanel) {
      RegexTesterProvider.currentPanel.reveal(column)
      return
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      'regexTester',
      'Testador de Regex',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: []
      }
    )

    RegexTesterProvider.currentPanel = panel

    // Set the webview's initial html content
    panel.webview.html = RegexTesterProvider.getWebviewContent(extensionUri)

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
        case 'testRegex':
          RegexTesterProvider.handleTestRegex(message.pattern, message.flags, message.text)
          break
        case 'insertInEditor':
          insertText(message.text)
          break
        case 'copyToClipboard':
          vscode.env.clipboard.writeText(message.text)
          vscode.window.showInformationMessage('Resultado copiado para a área de transferência!')
          break
        }
      },
      undefined
    )

    // Listen for when the panel is disposed
    panel.onDidDispose(
      () => {
        RegexTesterProvider.currentPanel = undefined
      },
      null
    )
  }  private static handleTestRegex (pattern: string, flags: string, text: string): void {
    const panel = RegexTesterProvider.currentPanel
    if (!panel) {
      return
    }

    try {
      if (!pattern) {
        RegexTesterProvider.sendErrorResult(panel, 'Padrão regex não pode estar vazio')
        return
      }

      const regex = new RegExp(pattern, flags)
      const matches = RegexTesterProvider.findMatches(regex, text, flags)
      const lineMatches = RegexTesterProvider.findLineMatches(pattern, flags, text)
      const fullMatch = RegexTesterProvider.testFullMatch(pattern, flags, text)

      panel.webview.postMessage({
        command: 'regexResult',
        result: {
          isValid: true,
          matches: matches,
          lineMatches: lineMatches,
          matchCount: matches.length,
          lineMatchCount: lineMatches.length,
          fullMatch: fullMatch,
          pattern: pattern,
          flags: flags,
          hasAnchors: pattern.includes('^') || pattern.includes('$'),
          isMultiline: text.includes('\n')
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      RegexTesterProvider.sendErrorResult(panel, errorMessage)
    }
  }

  private static sendErrorResult (panel: vscode.WebviewPanel, error: string): void {
    panel.webview.postMessage({
      command: 'regexResult',
      result: {
        isValid: false,
        error: error
      }
    })
  }

  private static findMatches (regex: RegExp, text: string, flags: string): MatchResult[] {
    const matches: MatchResult[] = []
    const globalTest = flags.includes('g')
    
    if (globalTest) {
      let match
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
          namedGroups: match.groups || {}
        })
        
        if (match.index === regex.lastIndex) {
          regex.lastIndex++
        }
      }
    } else {
      const match = regex.exec(text)
      if (match) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
          namedGroups: match.groups || {}
        })
      }
    }
    
    return matches
  }

  private static findLineMatches (pattern: string, flags: string, text: string): MatchResult[] {
    const lineMatches: MatchResult[] = []
    const hasAnchors = pattern.includes('^') || pattern.includes('$')
    
    if (hasAnchors && text.includes('\n')) {
      const lines = text.split('\n')
      const lineRegex = new RegExp(pattern, flags.replace('g', ''))
      
      lines.forEach((line, lineIndex) => {
        if (lineRegex.test(line.trim())) {
          const precedingText = lines.slice(0, lineIndex).join('\n')
          const lineStartIndex = precedingText.length + (lineIndex > 0 ? 1 : 0)
          
          lineMatches.push({
            match: line.trim(),
            index: lineStartIndex,
            line: lineIndex + 1,
            groups: [],
            namedGroups: {}
          })
        }
      })
    }
    
    return lineMatches
  }

  private static testFullMatch (pattern: string, flags: string, text: string): boolean {
    return new RegExp(`^${pattern}$`, flags.replace('g', '')).test(text)
  }
  
  private static getWebviewContent (extensionUri: vscode.Uri): string {
    return loadTemplate(extensionUri, 'regex-tester')
  }
}
