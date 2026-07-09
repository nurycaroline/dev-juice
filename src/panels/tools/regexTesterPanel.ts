import * as vscode from 'vscode'
import { insertText } from '../../utils/insertUtils'
import { BaseWebviewPanel, ValidatedMessage } from '../BaseWebviewPanel'

interface MatchResult {
  match: string
  index: number
  groups: string[]
  namedGroups: Record<string, string>
  line?: number
}

export class RegexTesterPanel extends BaseWebviewPanel {
  protected get messageWhitelist (): readonly string[] {
    return ['testRegex', 'insertInEditor', 'copyToClipboard']
  }

  protected onMessage (message: ValidatedMessage): void {
    switch (message.command) {
    case 'testRegex':
      this._testRegex(message.pattern as string, message.flags as string, message.text as string)
      return
    case 'insertInEditor':
      insertText(message.text as string)
      return
    case 'copyToClipboard':
      vscode.env.clipboard.writeText(message.text as string)
      vscode.window.showInformationMessage('Resultado copiado para a área de transferência!')
      return
    }
  }

  private _testRegex (pattern: string, flags: string, text: string): void {
    try {
      if (!pattern) {
        this._sendErrorResult('Padrão regex não pode estar vazio')
        return
      }
      const regex = new RegExp(pattern, flags)
      const matches = RegexTesterPanel.findMatches(regex, text, flags)
      const lineMatches = RegexTesterPanel.findLineMatches(pattern, flags, text)
      const fullMatch = RegexTesterPanel.testFullMatch(pattern, flags, text)

      void this.postMessage({
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
      this._sendErrorResult(errorMessage)
    }
  }

  private _sendErrorResult (error: string): void {
    void this.postMessage({
      command: 'regexResult',
      result: { isValid: false, error: error }
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
}
