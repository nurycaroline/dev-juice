import * as vscode from 'vscode';

/**
 * Provider for the Date Calculator webview panel
 */
export class DateCalculatorProvider {
    /**
     * Track the currently active panels. Only allow a single panel to exist at a time.
     */
    public static currentPanel: DateCalculatorProvider | undefined;

    public static readonly viewType = 'dateCalculator';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (DateCalculatorProvider.currentPanel) {
            DateCalculatorProvider.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            DateCalculatorProvider.viewType,
            'Calculadora de Data',
            column ?? vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'src', 'templates')
                ]
            }
        );

        DateCalculatorProvider.currentPanel = new DateCalculatorProvider(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'calculateDifference':
                        this._calculateDifference(message.date1, message.date2);
                        return;
                    case 'addTime':
                        this._addTime(message.date, message.amount, message.unit);
                        return;
                    case 'formatDate':
                        this._formatDate(message.date, message.formats);
                        return;
                    case 'copyToClipboard':
                        this._copyToClipboard(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    /**
     * Calculates the difference between two dates
     */
    private _calculateDifference(date1Str: string, date2Str: string) {
        try {
            const date1 = new Date(date1Str);
            const date2 = new Date(date2Str);

            if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
                throw new Error('Uma ou ambas as datas são inválidas');
            }

            const diffMs = Math.abs(date2.getTime() - date1.getTime());
            const diffSeconds = Math.floor(diffMs / 1000);
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffWeeks = Math.floor(diffDays / 7);
            const diffMonths = this._calculateMonthsDifference(date1, date2);
            const diffYears = Math.floor(diffMonths / 12);

            // Detailed breakdown
            const years = Math.floor(diffDays / 365.25);
            const remainingDaysAfterYears = diffDays - Math.floor(years * 365.25);
            const months = Math.floor(remainingDaysAfterYears / 30.44);
            const days = Math.floor(remainingDaysAfterYears - (months * 30.44));

            this._panel.webview.postMessage({
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
                    breakdown: {
                        years: years,
                        months: months,
                        days: days
                    },
                    isDate1Earlier: date1 < date2
                },
                success: true
            });
        } catch (error) {
            console.error('Erro ao calcular diferença:', error);
            this._panel.webview.postMessage({
                command: 'differenceCalculated',
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                success: false
            });
        }
    }

    /**
     * Adds or subtracts time from a date
     */
    private _addTime(dateStr: string, amount: number, unit: string) {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                throw new Error('Data inválida');
            }

            const newDate = new Date(date);

            switch (unit) {
                case 'seconds':
                    newDate.setSeconds(newDate.getSeconds() + amount);
                    break;
                case 'minutes':
                    newDate.setMinutes(newDate.getMinutes() + amount);
                    break;
                case 'hours':
                    newDate.setHours(newDate.getHours() + amount);
                    break;
                case 'days':
                    newDate.setDate(newDate.getDate() + amount);
                    break;
                case 'weeks':
                    newDate.setDate(newDate.getDate() + (amount * 7));
                    break;
                case 'months':
                    newDate.setMonth(newDate.getMonth() + amount);
                    break;
                case 'years':
                    newDate.setFullYear(newDate.getFullYear() + amount);
                    break;
                default:
                    throw new Error('Unidade de tempo inválida');
            }

            this._panel.webview.postMessage({
                command: 'timeAdded',
                result: {
                    originalDate: date.toISOString(),
                    newDate: newDate.toISOString(),
                    amount: amount,
                    unit: unit,
                    operation: amount >= 0 ? 'adição' : 'subtração'
                },
                success: true
            });
        } catch (error) {
            console.error('Erro ao adicionar tempo:', error);
            this._panel.webview.postMessage({
                command: 'timeAdded',
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                success: false
            });
        }
    }

    /**
     * Formats a date in various formats
     */
    private _formatDate(dateStr: string, formats: string[]) {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                throw new Error('Data inválida');
            }

            const result: { [key: string]: string } = {};

            formats.forEach(format => {
                switch (format) {
                    case 'iso':
                        result.iso = date.toISOString();
                        break;
                    case 'locale-br':
                        result['locale-br'] = date.toLocaleDateString('pt-BR');
                        break;
                    case 'locale-us':
                        result['locale-us'] = date.toLocaleDateString('en-US');
                        break;
                    case 'locale-full-br':
                        result['locale-full-br'] = date.toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        break;
                    case 'time-br':
                        result['time-br'] = date.toLocaleTimeString('pt-BR');
                        break;
                    case 'datetime-br':
                        result['datetime-br'] = date.toLocaleString('pt-BR');
                        break;
                    case 'unix':
                        result.unix = Math.floor(date.getTime() / 1000).toString();
                        break;
                    case 'unix-ms':
                        result['unix-ms'] = date.getTime().toString();
                        break;
                    case 'custom-br':
                        result['custom-br'] = this._formatCustom(date, 'dd/MM/yyyy HH:mm:ss');
                        break;
                    case 'custom-us':
                        result['custom-us'] = this._formatCustom(date, 'MM/dd/yyyy hh:mm:ss a');
                        break;
                    case 'sql':
                        result.sql = this._formatCustom(date, 'yyyy-MM-dd HH:mm:ss');
                        break;
                    case 'rfc2822':
                        result.rfc2822 = date.toString();
                        break;
                }
            });

            this._panel.webview.postMessage({
                command: 'dateFormatted',
                result: result,
                success: true
            });
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            this._panel.webview.postMessage({
                command: 'dateFormatted',
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                success: false
            });
        }
    }

    /**
     * Calculates months difference between two dates
     */
    private _calculateMonthsDifference(date1: Date, date2: Date): number {
        const startDate = date1 < date2 ? date1 : date2;
        const endDate = date1 < date2 ? date2 : date1;

        let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
        months += endDate.getMonth() - startDate.getMonth();

        if (endDate.getDate() < startDate.getDate()) {
            months--;
        }

        return months;
    }

    /**
     * Custom date formatting
     */
    private _formatCustom(date: Date, format: string): string {
        const map: { [key: string]: string } = {
            'yyyy': date.getFullYear().toString(),
            'yy': date.getFullYear().toString().slice(-2),
            'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
            'M': (date.getMonth() + 1).toString(),
            'dd': date.getDate().toString().padStart(2, '0'),
            'd': date.getDate().toString(),
            'HH': date.getHours().toString().padStart(2, '0'),
            'H': date.getHours().toString(),
            'hh': (date.getHours() % 12 || 12).toString().padStart(2, '0'),
            'h': (date.getHours() % 12 || 12).toString(),
            'mm': date.getMinutes().toString().padStart(2, '0'),
            'm': date.getMinutes().toString(),
            'ss': date.getSeconds().toString().padStart(2, '0'),
            's': date.getSeconds().toString(),
            'a': date.getHours() >= 12 ? 'PM' : 'AM'
        };

        let result = format;
        Object.keys(map).forEach(key => {
            result = result.replace(new RegExp(key, 'g'), map[key]);
        });

        return result;
    }

    /**
     * Copies text to clipboard
     */
    private async _copyToClipboard(text: string) {
        try {
            await vscode.env.clipboard.writeText(text);
            vscode.window.showInformationMessage('Data copiada para a área de transferência!');
        } catch (error) {
            console.error('Erro ao copiar data:', error);
            vscode.window.showErrorMessage('Erro ao copiar data para a área de transferência.');
        }
    }

    public dispose() {
        DateCalculatorProvider.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Calculadora de Data</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                        margin: 0;
                    }

                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }

                    h1 {
                        color: var(--vscode-titleBar-activeForeground);
                        margin-bottom: 20px;
                        text-align: center;
                    }

                    .tabs {
                        display: flex;
                        margin-bottom: 20px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                    }

                    .tab {
                        padding: 10px 20px;
                        cursor: pointer;
                        border-bottom: 2px solid transparent;
                        color: var(--vscode-descriptionForeground);
                    }

                    .tab.active {
                        color: var(--vscode-foreground);
                        border-bottom-color: var(--vscode-button-background);
                    }

                    .tab-content {
                        display: none;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 5px;
                        padding: 20px;
                    }

                    .tab-content.active {
                        display: block;
                    }

                    .form-group {
                        margin-bottom: 15px;
                    }

                    label {
                        display: block;
                        margin-bottom: 5px;
                        font-weight: bold;
                        color: var(--vscode-descriptionForeground);
                    }

                    input, select {
                        width: 100%;
                        padding: 8px 12px;
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 3px;
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        box-sizing: border-box;
                    }

                    input:focus, select:focus {
                        outline: none;
                        border-color: var(--vscode-focusBorder);
                    }

                    .button {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 10px 20px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        margin-right: 10px;
                        margin-bottom: 10px;
                    }

                    .button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }

                    .button.secondary {
                        background-color: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }

                    .result-section {
                        margin-top: 20px;
                        padding: 15px;
                        background-color: var(--vscode-textCodeBlock-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 5px;
                    }

                    .result-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px 0;
                        border-bottom: 1px solid var(--vscode-panel-border);
                    }

                    .result-item:last-child {
                        border-bottom: none;
                    }

                    .result-label {
                        font-weight: bold;
                        color: var(--vscode-descriptionForeground);
                    }

                    .result-value {
                        font-family: var(--vscode-editor-font-family);
                        color: var(--vscode-foreground);
                    }

                    .copy-button {
                        font-size: 12px;
                        padding: 5px 10px;
                    }

                    .error {
                        color: var(--vscode-errorForeground);
                        background-color: var(--vscode-inputValidation-errorBackground);
                        border: 1px solid var(--vscode-inputValidation-errorBorder);
                        padding: 8px;
                        border-radius: 3px;
                        margin: 10px 0;
                    }

                    .hidden {
                        display: none;
                    }

                    .input-row {
                        display: flex;
                        gap: 10px;
                        align-items: end;
                    }

                    .input-row .form-group {
                        flex: 1;
                        margin-bottom: 0;
                    }

                    .now-button {
                        background-color: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                        border: none;
                        padding: 5px 10px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 12px;
                        margin-top: 5px;
                    }

                    .breakdown {
                        background-color: var(--vscode-editor-background);
                        border-radius: 3px;
                        padding: 10px;
                        margin: 10px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>📅 Calculadora de Data</h1>
                    
                    <div class="tabs">
                        <div class="tab active" onclick="switchTab('difference')">Diferença entre Datas</div>
                        <div class="tab" onclick="switchTab('add')">Adicionar/Subtrair Tempo</div>
                        <div class="tab" onclick="switchTab('format')">Formatar Data</div>
                    </div>

                    <!-- Date Difference Tab -->
                    <div id="differenceTab" class="tab-content active">
                        <div class="form-group">
                            <label for="date1">Primeira Data</label>
                            <input type="datetime-local" id="date1">
                            <button type="button" class="now-button" onclick="setCurrentDate('date1')">Agora</button>
                        </div>

                        <div class="form-group">
                            <label for="date2">Segunda Data</label>
                            <input type="datetime-local" id="date2">
                            <button type="button" class="now-button" onclick="setCurrentDate('date2')">Agora</button>
                        </div>

                        <div class="form-group">
                            <button type="button" class="button" onclick="calculateDifference()">Calcular Diferença</button>
                            <button type="button" class="button secondary" onclick="clearDifference()">Limpar</button>
                        </div>

                        <div id="differenceError" class="error hidden"></div>
                        <div id="differenceResult" class="result-section hidden"></div>
                    </div>

                    <!-- Add Time Tab -->
                    <div id="addTab" class="tab-content">
                        <div class="form-group">
                            <label for="baseDate">Data Base</label>
                            <input type="datetime-local" id="baseDate">
                            <button type="button" class="now-button" onclick="setCurrentDate('baseDate')">Agora</button>
                        </div>

                        <div class="input-row">
                            <div class="form-group">
                                <label for="timeAmount">Quantidade</label>
                                <input type="number" id="timeAmount" placeholder="Digite um número (negativo para subtrair)">
                            </div>
                            <div class="form-group">
                                <label for="timeUnit">Unidade</label>
                                <select id="timeUnit">
                                    <option value="seconds">Segundos</option>
                                    <option value="minutes">Minutos</option>
                                    <option value="hours">Horas</option>
                                    <option value="days" selected>Dias</option>
                                    <option value="weeks">Semanas</option>
                                    <option value="months">Meses</option>
                                    <option value="years">Anos</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <button type="button" class="button" onclick="addTime()">Calcular</button>
                            <button type="button" class="button secondary" onclick="clearAddTime()">Limpar</button>
                        </div>

                        <div id="addTimeError" class="error hidden"></div>
                        <div id="addTimeResult" class="result-section hidden"></div>
                    </div>

                    <!-- Format Date Tab -->
                    <div id="formatTab" class="tab-content">
                        <div class="form-group">
                            <label for="formatDate">Data para Formatar</label>
                            <input type="datetime-local" id="formatDate">
                            <button type="button" class="now-button" onclick="setCurrentDate('formatDate')">Agora</button>
                        </div>

                        <div class="form-group">
                            <button type="button" class="button" onclick="formatDate()">Formatar Data</button>
                            <button type="button" class="button secondary" onclick="clearFormat()">Limpar</button>
                        </div>

                        <div id="formatError" class="error hidden"></div>
                        <div id="formatResult" class="result-section hidden"></div>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    function switchTab(tabName) {
                        // Update tab buttons
                        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
                        event.target.classList.add('active');

                        // Update tab content
                        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                        document.getElementById(tabName + 'Tab').classList.add('active');
                    }

                    function setCurrentDate(inputId) {
                        const now = new Date();
                        const localISOTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        document.getElementById(inputId).value = localISOTime;
                    }

                    function calculateDifference() {
                        const date1 = document.getElementById('date1').value;
                        const date2 = document.getElementById('date2').value;

                        if (!date1 || !date2) {
                            showError('differenceError', 'Por favor, preencha ambas as datas.');
                            return;
                        }

                        hideError('differenceError');

                        vscode.postMessage({
                            command: 'calculateDifference',
                            date1: date1,
                            date2: date2
                        });
                    }

                    function addTime() {
                        const date = document.getElementById('baseDate').value;
                        const amount = parseFloat(document.getElementById('timeAmount').value);
                        const unit = document.getElementById('timeUnit').value;

                        if (!date || isNaN(amount)) {
                            showError('addTimeError', 'Por favor, preencha a data e a quantidade.');
                            return;
                        }

                        hideError('addTimeError');

                        vscode.postMessage({
                            command: 'addTime',
                            date: date,
                            amount: amount,
                            unit: unit
                        });
                    }

                    function formatDate() {
                        const date = document.getElementById('formatDate').value;

                        if (!date) {
                            showError('formatError', 'Por favor, preencha a data.');
                            return;
                        }

                        hideError('formatError');

                        const formats = ['iso', 'locale-br', 'locale-us', 'locale-full-br', 'time-br', 'datetime-br', 'unix', 'unix-ms', 'custom-br', 'custom-us', 'sql', 'rfc2822'];

                        vscode.postMessage({
                            command: 'formatDate',
                            date: date,
                            formats: formats
                        });
                    }

                    function clearDifference() {
                        document.getElementById('date1').value = '';
                        document.getElementById('date2').value = '';
                        document.getElementById('differenceResult').classList.add('hidden');
                        hideError('differenceError');
                    }

                    function clearAddTime() {
                        document.getElementById('baseDate').value = '';
                        document.getElementById('timeAmount').value = '';
                        document.getElementById('addTimeResult').classList.add('hidden');
                        hideError('addTimeError');
                    }

                    function clearFormat() {
                        document.getElementById('formatDate').value = '';
                        document.getElementById('formatResult').classList.add('hidden');
                        hideError('formatError');
                    }

                    function showError(elementId, message) {
                        const errorDiv = document.getElementById(elementId);
                        errorDiv.textContent = message;
                        errorDiv.classList.remove('hidden');
                    }

                    function hideError(elementId) {
                        document.getElementById(elementId).classList.add('hidden');
                    }

                    function copyValue(value) {
                        vscode.postMessage({
                            command: 'copyToClipboard',
                            text: value
                        });
                    }

                    function displayDifferenceResult(result) {
                        const resultDiv = document.getElementById('differenceResult');
                        
                        let html = \`
                            <div class="breakdown">
                                <strong>Detalhamento:</strong> \${result.breakdown.years} anos, \${result.breakdown.months} meses, \${result.breakdown.days} dias
                                <br><small>\${result.isDate1Earlier ? 'A primeira data é anterior à segunda' : 'A segunda data é anterior à primeira'}</small>
                            </div>
                        \`;

                        const items = [
                            { label: 'Anos', value: result.years },
                            { label: 'Meses', value: result.months },
                            { label: 'Semanas', value: result.weeks },
                            { label: 'Dias', value: result.days },
                            { label: 'Horas', value: result.hours },
                            { label: 'Minutos', value: result.minutes },
                            { label: 'Segundos', value: result.seconds },
                            { label: 'Milissegundos', value: result.milliseconds }
                        ];

                        items.forEach(item => {
                            html += \`
                                <div class="result-item">
                                    <span class="result-label">\${item.label}:</span>
                                    <span class="result-value">\${item.value.toLocaleString()}</span>
                                    <button class="button copy-button" onclick="copyValue('\${item.value}')">📋</button>
                                </div>
                            \`;
                        });

                        resultDiv.innerHTML = html;
                        resultDiv.classList.remove('hidden');
                    }

                    function displayAddTimeResult(result) {
                        const resultDiv = document.getElementById('addTimeResult');
                        const operation = result.operation;
                        const amount = Math.abs(result.amount);
                        
                        resultDiv.innerHTML = \`
                            <div class="result-item">
                                <span class="result-label">Data Original:</span>
                                <span class="result-value">\${new Date(result.originalDate).toLocaleString('pt-BR')}</span>
                                <button class="button copy-button" onclick="copyValue('\${new Date(result.originalDate).toLocaleString('pt-BR')}')">📋</button>
                            </div>
                            <div class="result-item">
                                <span class="result-label">Operação:</span>
                                <span class="result-value">\${operation} de \${amount} \${result.unit}</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">Nova Data:</span>
                                <span class="result-value">\${new Date(result.newDate).toLocaleString('pt-BR')}</span>
                                <button class="button copy-button" onclick="copyValue('\${new Date(result.newDate).toLocaleString('pt-BR')}')">📋</button>
                            </div>
                        \`;
                        resultDiv.classList.remove('hidden');
                    }

                    function displayFormatResult(result) {
                        const resultDiv = document.getElementById('formatResult');
                        
                        const formatLabels = {
                            'iso': 'ISO 8601',
                            'locale-br': 'Data Brasileira',
                            'locale-us': 'Data Americana',
                            'locale-full-br': 'Data Completa (BR)',
                            'time-br': 'Hora (BR)',
                            'datetime-br': 'Data e Hora (BR)',
                            'unix': 'Unix Timestamp',
                            'unix-ms': 'Unix Timestamp (ms)',
                            'custom-br': 'Formato Personalizado (BR)',
                            'custom-us': 'Formato Personalizado (US)',
                            'sql': 'SQL DateTime',
                            'rfc2822': 'RFC 2822'
                        };

                        let html = '';
                        Object.keys(result).forEach(format => {
                            html += \`
                                <div class="result-item">
                                    <span class="result-label">\${formatLabels[format] || format}:</span>
                                    <span class="result-value">\${result[format]}</span>
                                    <button class="button copy-button" onclick="copyValue('\${result[format]}')">📋</button>
                                </div>
                            \`;
                        });

                        resultDiv.innerHTML = html;
                        resultDiv.classList.remove('hidden');
                    }

                    // Receber mensagens do VS Code
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        switch (message.command) {
                            case 'differenceCalculated':
                                if (message.success) {
                                    displayDifferenceResult(message.result);
                                } else {
                                    showError('differenceError', message.error);
                                }
                                break;
                            case 'timeAdded':
                                if (message.success) {
                                    displayAddTimeResult(message.result);
                                } else {
                                    showError('addTimeError', message.error);
                                }
                                break;
                            case 'dateFormatted':
                                if (message.success) {
                                    displayFormatResult(message.result);
                                } else {
                                    showError('formatError', message.error);
                                }
                                break;
                        }
                    });

                    // Initialize with current date
                    window.addEventListener('load', () => {
                        setCurrentDate('date1');
                    });
                </script>
            </body>
            </html>
        `;
    }
}
