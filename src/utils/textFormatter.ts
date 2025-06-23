export class TextFormatter {
  static detectFormat (text: string): string {
    const trimmedText = text.trim()

    if (!trimmedText) {
      return 'unknown'
    }

    if (trimmedText.includes('_') && !trimmedText.includes(' ') && !trimmedText.includes('-')) {
      return 'snake'
    }

    if (trimmedText.includes('-') && !trimmedText.includes(' ') && !trimmedText.includes('_')) {
      return 'kebab'
    }

    if (!/[\s\-_]/.test(trimmedText) && /[a-z]/.test(trimmedText[0]) && /[A-Z]/.test(trimmedText)) {
      return 'camel'
    }

    if (!/[\s\-_]/.test(trimmedText) && /[A-Z]/.test(trimmedText[0]) && /[a-z]/.test(trimmedText)) {
      return 'pascal'
    }

    if (trimmedText.includes('.') && !trimmedText.includes(' ') && !trimmedText.includes('-') && !trimmedText.includes('_')) {
      return 'dot'
    }

    if (trimmedText.includes('/') && !trimmedText.includes(' ')) {
      return 'path'
    }

    if (trimmedText.includes(' ')) {
      return 'normal'
    }

    return 'unknown'
  }

  static normalizeText (text: string): string[] {
    const trimmedText = text.trim()
    if (!trimmedText) {
      return []
    }

    const format = this.detectFormat(trimmedText)

    switch (format) {
    case 'snake':
      return trimmedText.split('_').filter(word => word.length > 0)
    case 'kebab':
      return trimmedText.split('-').filter(word => word.length > 0)
    case 'camel':
    case 'pascal':
      return trimmedText
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ')
        .filter(word => word.length > 0)
    case 'dot':
      return trimmedText.split('.').filter(word => word.length > 0)
    case 'path':
      return trimmedText.split('/').filter(word => word.length > 0)
    case 'normal':
      return trimmedText.split(/\s+/).filter(word => word.length > 0)
    default:
      return trimmedText
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 0)
    }
  }

  static toSentenceCase (text: string): string {
    return text.toLowerCase().replace(/^\w/, c => c.toUpperCase())
  }
  static toSnakeCase (text: string): string {
    const words = this.normalizeText(text)
    return words.map(word => word.toLowerCase()).join('_')
  }

  static toCamelCase (text: string): string {
    const words = this.normalizeText(text)
    return words
      .map((word, index) => {
        if (index === 0) {
          return word.toLowerCase()
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      })
      .join('')
  }

  static toKebabCase (text: string): string {
    const words = this.normalizeText(text)
    return words.map(word => word.toLowerCase()).join('-')
  }
  static toPascalCase (text: string): string {
    const words = this.normalizeText(text)
    return words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }

  static toCapitalizedCase (text: string): string {
    const words = this.normalizeText(text)
    return words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  static toAlternatingCase (text: string): string {
    const letterRegex = /[a-zA-Z]/
    return text
      .split('')
      .map((char, index) => {
        if (letterRegex.exec(char)) {
          return index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
        }
        return char
      })
      .join('')
  }

  static toInverseCase (text: string): string {
    return text
      .split('')
      .map(char => {
        if (char === char.toUpperCase()) {
          return char.toLowerCase()
        } else {
          return char.toUpperCase()
        }
      })
      .join('')
  }
  static toDotNotation (text: string): string {
    const words = this.normalizeText(text)
    return words.map(word => word.toLowerCase()).join('.')
  }

  static toPathStyle (text: string): string {
    const words = this.normalizeText(text)
    return words.map(word => word.toLowerCase()).join('/')
  }
  static toParamsStyle (text: string): string {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)

    return lines.map(line => {
      const words = line.trim().split(/\s+/)
      if (words.length >= 2) {
        return `${words[0]}: ${words.slice(1).join(' ')}`
      } else if (words.length === 1) {
        return `${words[0]}:`
      }
      return ''
    }).join('\n')
  }

  static format (text: string, format: string): string {
    if (!text) {
      return ''
    }

    switch (format) {
    case 'sentence':
      return TextFormatter.toSentenceCase(text)
    case 'snake':
      return TextFormatter.toSnakeCase(text)
    case 'camel':
      return TextFormatter.toCamelCase(text)
    case 'kebab':
      return TextFormatter.toKebabCase(text)
    case 'pascal':
      return TextFormatter.toPascalCase(text)
    case 'lower':
      return text.toLowerCase()
    case 'upper':
      return text.toUpperCase()
    case 'capital':
      return TextFormatter.toCapitalizedCase(text)
    case 'alternating':
      return TextFormatter.toAlternatingCase(text)
    case 'inverse':
      return TextFormatter.toInverseCase(text)
    case 'dot':
      return TextFormatter.toDotNotation(text)
    case 'params':
      return TextFormatter.toParamsStyle(text)
    case 'path':
      return TextFormatter.toPathStyle(text)
    default:
      return text
    }
  }
}
