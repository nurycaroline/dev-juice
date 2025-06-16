export class TextFormatter {
  static toSentenceCase (text: string): string {
    return text.toLowerCase().replace(/^\w/, c => c.toUpperCase())
  }

  static toSnakeCase (text: string): string {
    return text
      .replace(/\W+/g, ' ')
      .split(' ')
      .map(word => word.toLowerCase())
      .filter(word => word.length > 0)
      .join('_')
  }

  static toCamelCase (text: string): string {
    return text
      .replace(/\W+/g, ' ')
      .split(' ')
      .map((word, index) => {
        if (index === 0) {
          return word.toLowerCase()
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      })
      .filter(word => word.length > 0)
      .join('')
  }

  static toKebabCase (text: string): string {
    return text
      .replace(/\W+/g, ' ')
      .split(' ')
      .map(word => word.toLowerCase())
      .filter(word => word.length > 0)
      .join('-')
  }

  static toPascalCase (text: string): string {
    return text
      .replace(/\W+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .filter(word => word.length > 0)
      .join('')
  }

  static toCapitalizedCase (text: string): string {
    return text
      .split(' ')
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
    return text
      .replace(/\W+/g, ' ')
      .split(' ')
      .map(word => word.toLowerCase())
      .filter(word => word.length > 0)
      .join('.')
  }  static toParamsStyle (text: string): string {
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

  static toPathStyle (text: string): string {
    return text
      .replace(/\W+/g, ' ')
      .split(' ')
      .map(word => word.toLowerCase())
      .filter(word => word.length > 0)
      .join('/')
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
