import * as vscode from 'vscode'
import { BaseWebviewPanel, ValidatedMessage } from '../BaseWebviewPanel'

export class DateCalculatorPanel extends BaseWebviewPanel {
  protected get messageWhitelist (): readonly string[] {
    return ['calculateDifference', 'addTime', 'formatDate', 'copyToClipboard']
  }

  protected onMessage (message: ValidatedMessage): void {
    switch (message.command) {
    case 'calculateDifference':
      this._calculateDifference(message.date1 as string, message.date2 as string)
      return
    case 'addTime':
      this._addTime(message.date as string, message.amount as number, message.unit as string)
      return
    case 'formatDate':
      this._formatDate(message.date as string, message.formats as string[])
      return
    case 'copyToClipboard':
      void this._copyToClipboard(message.text as string)
      return
    }
  }

  private _calculateDifference (date1Str: string, date2Str: string): void {
    try {
      const date1 = new Date(date1Str)
      const date2 = new Date(date2Str)
      if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
        throw new Error('Uma ou ambas as datas são inválidas')
      }
      const diffMs = Math.abs(date2.getTime() - date1.getTime())
      const diffSeconds = Math.floor(diffMs / 1000)
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const diffWeeks = Math.floor(diffDays / 7)
      const diffMonths = this._calculateMonthsDifference(date1, date2)
      const diffYears = Math.floor(diffMonths / 12)
      const years = Math.floor(diffDays / 365.25)
      const remainingDaysAfterYears = diffDays - Math.floor(years * 365.25)
      const months = Math.floor(remainingDaysAfterYears / 30.44)
      const days = Math.floor(remainingDaysAfterYears - (months * 30.44))

      void this.postMessage({
        command: 'differenceCalculated',
        result: {
          milliseconds: diffMs,
          seconds: diffSeconds,
          minutes: diffMinutes,
          hours: diffHours,
          days: diffDays,
          weeks: diffWeeks,
          months: diffMonths,
          years: diffYears,
          breakdown: { years: years, months: months, days: days },
          isDate1Earlier: date1 < date2
        },
        success: true
      })
    } catch (error) {
      console.error('Erro ao calcular diferença:', error)
      void this.postMessage({
        command: 'differenceCalculated',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      })
    }
  }

  private _addTime (dateStr: string, amount: number, unit: string): void {
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) {
        throw new Error('Data inválida')
      }
      const newDate = new Date(date)
      switch (unit) {
      case 'seconds': newDate.setSeconds(newDate.getSeconds() + amount); break
      case 'minutes': newDate.setMinutes(newDate.getMinutes() + amount); break
      case 'hours': newDate.setHours(newDate.getHours() + amount); break
      case 'days': newDate.setDate(newDate.getDate() + amount); break
      case 'weeks': newDate.setDate(newDate.getDate() + (amount * 7)); break
      case 'months': newDate.setMonth(newDate.getMonth() + amount); break
      case 'years': newDate.setFullYear(newDate.getFullYear() + amount); break
      default: throw new Error('Unidade de tempo inválida')
      }
      void this.postMessage({
        command: 'timeAdded',
        result: {
          originalDate: date.toISOString(),
          newDate: newDate.toISOString(),
          amount: amount,
          unit: unit,
          operation: amount >= 0 ? 'adição' : 'subtração'
        },
        success: true
      })
    } catch (error) {
      console.error('Erro ao adicionar tempo:', error)
      void this.postMessage({
        command: 'timeAdded',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      })
    }
  }

  private _formatDate (dateStr: string, formats: string[]): void {
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) {
        throw new Error('Data inválida')
      }
      const result: { [key: string]: string } = {}
      formats.forEach(format => {
        switch (format) {
        case 'iso': result.iso = date.toISOString(); break
        case 'locale-br': result['locale-br'] = date.toLocaleDateString('pt-BR'); break
        case 'locale-us': result['locale-us'] = date.toLocaleDateString('en-US'); break
        case 'locale-full-br':
          result['locale-full-br'] = date.toLocaleDateString('pt-BR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })
          break
        case 'time-br': result['time-br'] = date.toLocaleTimeString('pt-BR'); break
        case 'datetime-br': result['datetime-br'] = date.toLocaleString('pt-BR'); break
        case 'unix': result.unix = Math.floor(date.getTime() / 1000).toString(); break
        case 'unix-ms': result['unix-ms'] = date.getTime().toString(); break
        case 'custom-br': result['custom-br'] = this._formatCustom(date, 'dd/MM/yyyy HH:mm:ss'); break
        case 'custom-us': result['custom-us'] = this._formatCustom(date, 'MM/dd/yyyy hh:mm:ss a'); break
        case 'sql': result.sql = this._formatCustom(date, 'yyyy-MM-dd HH:mm:ss'); break
        case 'rfc2822': result.rfc2822 = date.toString(); break
        }
      })
      void this.postMessage({ command: 'dateFormatted', result: result, success: true })
    } catch (error) {
      console.error('Erro ao formatar data:', error)
      void this.postMessage({
        command: 'dateFormatted',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      })
    }
  }

  private _calculateMonthsDifference (date1: Date, date2: Date): number {
    const startDate = date1 < date2 ? date1 : date2
    const endDate = date1 < date2 ? date2 : date1
    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12
    months += endDate.getMonth() - startDate.getMonth()
    if (endDate.getDate() < startDate.getDate()) {
      months--
    }
    return months
  }

  private _formatCustom (date: Date, format: string): string {
    const map: { [key: string]: string } = {
      yyyy: date.getFullYear().toString(),
      yy: date.getFullYear().toString().slice(-2),
      MM: (date.getMonth() + 1).toString().padStart(2, '0'),
      M: (date.getMonth() + 1).toString(),
      dd: date.getDate().toString().padStart(2, '0'),
      d: date.getDate().toString(),
      HH: date.getHours().toString().padStart(2, '0'),
      H: date.getHours().toString(),
      hh: (date.getHours() % 12 || 12).toString().padStart(2, '0'),
      h: (date.getHours() % 12 || 12).toString(),
      mm: date.getMinutes().toString().padStart(2, '0'),
      m: date.getMinutes().toString(),
      ss: date.getSeconds().toString().padStart(2, '0'),
      s: date.getSeconds().toString(),
      a: date.getHours() >= 12 ? 'PM' : 'AM'
    }
    let result = format
    Object.keys(map).forEach(key => {
      result = result.replace(new RegExp(key, 'g'), map[key])
    })
    return result
  }

  private async _copyToClipboard (text: string): Promise<void> {
    try {
      await vscode.env.clipboard.writeText(text)
      vscode.window.showInformationMessage('Data copiada para a área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar data:', error)
      vscode.window.showErrorMessage('Erro ao copiar data para a área de transferência.')
    }
  }
}
