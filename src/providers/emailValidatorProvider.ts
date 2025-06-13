import * as vscode from 'vscode';

/**
 * Provider for the Email Validator webview panel
 */
export class EmailValidatorProvider {
    /**
     * Track the currently active panels. Only allow a single panel to exist at a time.
     */
    public static currentPanel: EmailValidatorProvider | undefined;

    public static readonly viewType = 'emailValidator';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (EmailValidatorProvider.currentPanel) {
            EmailValidatorProvider.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            EmailValidatorProvider.viewType,
            'Validador de Email',
            column ?? vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'src', 'templates')
                ]
            }
        );

        EmailValidatorProvider.currentPanel = new EmailValidatorProvider(panel, extensionUri);
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
                    case 'validateEmail':
                        this._validateEmail(message.email);
                        return;
                    case 'validateBulkEmails':
                        this._validateBulkEmails(message.emails);
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
     * Validates a single email address
     */
    private _validateEmail(email: string) {
        const validation = this._performEmailValidation(email);
        
        this._panel.webview.postMessage({
            command: 'emailValidated',
            email: email,
            validation: validation,
            success: true
        });
    }

    /**
     * Validates multiple email addresses
     */
    private _validateBulkEmails(emailsText: string) {
        const emails = emailsText.split(/[,;\n\r]+/)
            .map(email => email.trim())
            .filter(email => email.length > 0);

        const results = emails.map(email => ({
            email: email,
            validation: this._performEmailValidation(email)
        }));

        this._panel.webview.postMessage({
            command: 'bulkEmailsValidated',
            results: results,
            summary: this._generateSummary(results),
            success: true
        });
    }

    /**
     * Performs detailed email validation
     */
    private _performEmailValidation(email: string): any {
        const result = {
            isValid: false,
            format: 'Inválido',
            details: [] as string[],
            warnings: [] as string[],
            suggestions: [] as string[]
        };

        // Basic format validation
        const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isBasicValid = basicRegex.test(email);

        if (!isBasicValid) {
            result.details.push('Formato básico inválido');
            
            if (!email.includes('@')) {
                result.suggestions.push('Email deve conter o símbolo @');
            }
            if (!email.includes('.')) {
                result.suggestions.push('Email deve conter um domínio com ponto');
            }
            if (email.includes(' ')) {
                result.suggestions.push('Email não pode conter espaços');
            }
            
            return result;
        }

        // More detailed validation
        const [localPart, domain] = email.split('@');
        
        // RFC 5322 compliant regex (simplified)
        const rfcRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        const isRfcCompliant = rfcRegex.test(email);

        if (isRfcCompliant) {
            result.isValid = true;
            result.format = 'Válido';
            result.details.push('Formato RFC 5322 compliant');
        } else {
            result.format = 'Formato inválido';
            result.details.push('Não está em conformidade com RFC 5322');
        }

        // Additional checks
        this._checkLocalPart(localPart, result);
        this._checkDomain(domain, result);
        this._checkCommonIssues(email, result);
        this._checkCommonDomains(domain, result);

        return result;
    }

    /**
     * Validates the local part (before @)
     */
    private _checkLocalPart(localPart: string, result: any) {
        if (localPart.length > 64) {
            result.warnings.push('Parte local muito longa (máximo 64 caracteres)');
        }
        
        if (localPart.startsWith('.') || localPart.endsWith('.')) {
            result.warnings.push('Parte local não deve começar ou terminar com ponto');
        }
        
        if (localPart.includes('..')) {
            result.warnings.push('Parte local não deve conter pontos consecutivos');
        }

        // Check for valid characters in local part
        const validLocalRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
        if (!validLocalRegex.test(localPart)) {
            result.warnings.push('Parte local contém caracteres inválidos');
        }
    }

    /**
     * Validates the domain part (after @)
     */
    private _checkDomain(domain: string, result: any) {
        if (domain.length > 253) {
            result.warnings.push('Domínio muito longo (máximo 253 caracteres)');
        }

        if (domain.startsWith('-') || domain.endsWith('-')) {
            result.warnings.push('Domínio não deve começar ou terminar com hífen');
        }

        if (domain.startsWith('.') || domain.endsWith('.')) {
            result.warnings.push('Domínio não deve começar ou terminar com ponto');
        }

        // Check for valid domain format
        const domainParts = domain.split('.');
        if (domainParts.length < 2) {
            result.warnings.push('Domínio deve ter pelo menos um ponto');
        }

        // Check TLD
        const tld = domainParts[domainParts.length - 1];
        if (tld.length < 2) {
            result.warnings.push('TLD (extensão) deve ter pelo menos 2 caracteres');
        }

        // Check for numeric-only domain (usually invalid)
        if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
            result.warnings.push('Domínio parece ser um IP - geralmente inválido para email');
        }
    }

    /**
     * Checks for common email issues
     */
    private _checkCommonIssues(email: string, result: any) {
        // Multiple @ symbols
        if ((email.match(/@/g) || []).length > 1) {
            result.warnings.push('Email contém múltiplos símbolos @');
        }

        // Common typos in domains
        const commonTypos = [
            { wrong: 'gmail.co', correct: 'gmail.com' },
            { wrong: 'gmail.cm', correct: 'gmail.com' },
            { wrong: 'gamil.com', correct: 'gmail.com' },
            { wrong: 'gmai.com', correct: 'gmail.com' },
            { wrong: 'yahoo.co', correct: 'yahoo.com' },
            { wrong: 'hotmial.com', correct: 'hotmail.com' },
            { wrong: 'hotmai.com', correct: 'hotmail.com' },
            { wrong: 'outlok.com', correct: 'outlook.com' }
        ];

        const domain = email.split('@')[1];
        const typo = commonTypos.find(t => domain === t.wrong);
        if (typo) {
            result.suggestions.push(`Você quis dizer ${email.replace(typo.wrong, typo.correct)}?`);
        }
    }    /**
     * Provides information about common email providers
     */
    private _checkCommonDomains(domain: string, result: any) {
        const providers: { [key: string]: string } = {
            'gmail.com': 'Google Gmail',
            'yahoo.com': 'Yahoo Mail',
            'yahoo.com.br': 'Yahoo Brasil',
            'hotmail.com': 'Microsoft Hotmail',
            'outlook.com': 'Microsoft Outlook',
            'live.com': 'Microsoft Live',
            'msn.com': 'Microsoft MSN',
            'terra.com.br': 'Terra Brasil',
            'uol.com.br': 'UOL Brasil',
            'globo.com': 'Globo',
            'ig.com.br': 'iG Brasil',
            'bol.com.br': 'BOL Brasil'
        };

        const provider = providers[domain.toLowerCase()];
        if (provider) {
            result.details.push(`Provedor: ${provider}`);
        }
    }

    /**
     * Generates summary for bulk validation
     */
    private _generateSummary(results: any[]) {
        const total = results.length;
        const valid = results.filter(r => r.validation.isValid).length;
        const invalid = total - valid;
        const withWarnings = results.filter(r => r.validation.warnings.length > 0).length;

        return {
            total,
            valid,
            invalid,
            withWarnings,
            validPercentage: Math.round((valid / total) * 100)
        };
    }

    /**
     * Copies text to clipboard
     */
    private async _copyToClipboard(text: string) {
        try {
            await vscode.env.clipboard.writeText(text);
            vscode.window.showInformationMessage('Texto copiado para a área de transferência!');
        } catch (error) {
            console.error('Erro ao copiar texto:', error);
            vscode.window.showErrorMessage('Erro ao copiar texto para a área de transferência.');
        }
    }

    public dispose() {
        EmailValidatorProvider.currentPanel = undefined;

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
                <title>Validador de Email</title>
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

                    input, textarea {
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

                    textarea {
                        height: 120px;
                        resize: vertical;
                    }

                    input:focus, textarea:focus {
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

                    .validation-result {
                        margin-top: 20px;
                        padding: 15px;
                        border-radius: 5px;
                        border: 1px solid var(--vscode-panel-border);
                    }

                    .validation-result.valid {
                        background-color: var(--vscode-diffEditor-insertedTextBackground);
                        border-color: var(--vscode-terminal-ansiGreen);
                    }

                    .validation-result.invalid {
                        background-color: var(--vscode-inputValidation-errorBackground);
                        border-color: var(--vscode-errorForeground);
                    }

                    .email-display {
                        font-family: var(--vscode-editor-font-family);
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }

                    .status-icon {
                        font-size: 20px;
                        margin-right: 8px;
                    }

                    .details-section {
                        margin-top: 15px;
                    }

                    .details-section h4 {
                        margin: 10px 0 5px 0;
                        color: var(--vscode-descriptionForeground);
                    }

                    .details-list {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }

                    .details-list li {
                        padding: 3px 0;
                        border-left: 3px solid transparent;
                        padding-left: 10px;
                    }

                    .details-list li.info {
                        border-left-color: var(--vscode-terminal-ansiBlue);
                    }

                    .details-list li.warning {
                        border-left-color: var(--vscode-terminal-ansiYellow);
                    }

                    .details-list li.suggestion {
                        border-left-color: var(--vscode-terminal-ansiGreen);
                    }

                    .bulk-summary {
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 5px;
                        padding: 15px;
                        margin-bottom: 20px;
                    }

                    .summary-stats {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                        gap: 15px;
                        margin-bottom: 15px;
                    }

                    .stat-item {
                        text-align: center;
                        padding: 10px;
                        background-color: var(--vscode-textCodeBlock-background);
                        border-radius: 3px;
                    }

                    .stat-number {
                        font-size: 24px;
                        font-weight: bold;
                        color: var(--vscode-terminal-ansiBlue);
                    }

                    .stat-label {
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                    }

                    .bulk-results {
                        max-height: 400px;
                        overflow-y: auto;
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 3px;
                    }

                    .bulk-item {
                        padding: 10px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        display: flex;
                        align-items: center;
                    }

                    .bulk-item:last-child {
                        border-bottom: none;
                    }

                    .bulk-email {
                        flex: 1;
                        font-family: var(--vscode-editor-font-family);
                        margin-right: 10px;
                    }

                    .bulk-status {
                        font-size: 18px;
                    }

                    .hidden {
                        display: none;
                    }

                    .copy-button {
                        font-size: 12px;
                        padding: 5px 10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>📧 Validador de Email</h1>
                    
                    <div class="tabs">
                        <div class="tab active" onclick="switchTab('single')">Validação Única</div>
                        <div class="tab" onclick="switchTab('bulk')">Validação em Lote</div>
                    </div>

                    <!-- Single Email Validation -->
                    <div id="singleTab" class="tab-content active">
                        <div class="form-group">
                            <label for="singleEmail">Endereço de Email</label>
                            <input type="email" id="singleEmail" placeholder="digite@exemplo.com" 
                                   oninput="validateEmailRealTime()">
                        </div>

                        <div class="form-group">
                            <button type="button" class="button" onclick="validateSingleEmail()">Validar Email</button>
                            <button type="button" class="button secondary" onclick="clearSingle()">Limpar</button>
                        </div>

                        <div id="singleResult" class="hidden"></div>
                    </div>

                    <!-- Bulk Email Validation -->
                    <div id="bulkTab" class="tab-content">
                        <div class="form-group">
                            <label for="bulkEmails">Lista de Emails (separados por vírgula, ponto e vírgula ou quebra de linha)</label>
                            <textarea id="bulkEmails" placeholder="email1@exemplo.com, email2@exemplo.com\nemail3@exemplo.com"></textarea>
                        </div>

                        <div class="form-group">
                            <button type="button" class="button" onclick="validateBulkEmails()">Validar Lista</button>
                            <button type="button" class="button secondary" onclick="clearBulk()">Limpar</button>
                        </div>

                        <div id="bulkSummary" class="hidden"></div>
                        <div id="bulkResults" class="hidden"></div>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    let currentValidationTimer = null;

                    function switchTab(tabName) {
                        // Update tab buttons
                        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
                        event.target.classList.add('active');

                        // Update tab content
                        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                        document.getElementById(tabName + 'Tab').classList.add('active');
                    }

                    function validateEmailRealTime() {
                        clearTimeout(currentValidationTimer);
                        currentValidationTimer = setTimeout(() => {
                            const email = document.getElementById('singleEmail').value.trim();
                            if (email) {
                                validateSingleEmail();
                            } else {
                                document.getElementById('singleResult').classList.add('hidden');
                            }
                        }, 500);
                    }

                    function validateSingleEmail() {
                        const email = document.getElementById('singleEmail').value.trim();
                        if (!email) {
                            return;
                        }

                        vscode.postMessage({
                            command: 'validateEmail',
                            email: email
                        });
                    }

                    function validateBulkEmails() {
                        const emails = document.getElementById('bulkEmails').value.trim();
                        if (!emails) {
                            return;
                        }

                        vscode.postMessage({
                            command: 'validateBulkEmails',
                            emails: emails
                        });
                    }

                    function clearSingle() {
                        document.getElementById('singleEmail').value = '';
                        document.getElementById('singleResult').classList.add('hidden');
                    }

                    function clearBulk() {
                        document.getElementById('bulkEmails').value = '';
                        document.getElementById('bulkSummary').classList.add('hidden');
                        document.getElementById('bulkResults').classList.add('hidden');
                    }

                    function copyValidEmails(emails) {
                        const validEmails = emails.filter(r => r.validation.isValid).map(r => r.email);
                        vscode.postMessage({
                            command: 'copyToClipboard',
                            text: validEmails.join(', ')
                        });
                    }

                    function displaySingleResult(email, validation) {
                        const resultDiv = document.getElementById('singleResult');
                        const isValid = validation.isValid;
                        
                        let html = \`
                            <div class="validation-result \${isValid ? 'valid' : 'invalid'}">
                                <div class="email-display">
                                    <span class="status-icon">\${isValid ? '✅' : '❌'}</span>
                                    \${email}
                                </div>
                                <div><strong>Status:</strong> \${validation.format}</div>
                        \`;

                        if (validation.details.length > 0) {
                            html += '<div class="details-section"><h4>Detalhes:</h4><ul class="details-list">';
                            validation.details.forEach(detail => {
                                html += \`<li class="info">ℹ️ \${detail}</li>\`;
                            });
                            html += '</ul></div>';
                        }

                        if (validation.warnings.length > 0) {
                            html += '<div class="details-section"><h4>Avisos:</h4><ul class="details-list">';
                            validation.warnings.forEach(warning => {
                                html += \`<li class="warning">⚠️ \${warning}</li>\`;
                            });
                            html += '</ul></div>';
                        }

                        if (validation.suggestions.length > 0) {
                            html += '<div class="details-section"><h4>Sugestões:</h4><ul class="details-list">';
                            validation.suggestions.forEach(suggestion => {
                                html += \`<li class="suggestion">💡 \${suggestion}</li>\`;
                            });
                            html += '</ul></div>';
                        }

                        html += '</div>';
                        resultDiv.innerHTML = html;
                        resultDiv.classList.remove('hidden');
                    }

                    function displayBulkResults(results, summary) {
                        // Display summary
                        const summaryDiv = document.getElementById('bulkSummary');
                        summaryDiv.innerHTML = \`
                            <div class="bulk-summary">
                                <h3>Resumo da Validação</h3>
                                <div class="summary-stats">
                                    <div class="stat-item">
                                        <div class="stat-number">\${summary.total}</div>
                                        <div class="stat-label">Total</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-number">\${summary.valid}</div>
                                        <div class="stat-label">Válidos</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-number">\${summary.invalid}</div>
                                        <div class="stat-label">Inválidos</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-number">\${summary.validPercentage}%</div>
                                        <div class="stat-label">Taxa de Sucesso</div>
                                    </div>
                                </div>
                                <button type="button" class="button copy-button" onclick="copyValidEmails(\${JSON.stringify(results).replace(/"/g, '&quot;')})">
                                    📋 Copiar Emails Válidos
                                </button>
                            </div>
                        \`;
                        summaryDiv.classList.remove('hidden');

                        // Display results
                        const resultsDiv = document.getElementById('bulkResults');
                        let html = '<div class="bulk-results">';
                        
                        results.forEach(result => {
                            const isValid = result.validation.isValid;
                            html += \`
                                <div class="bulk-item">
                                    <div class="bulk-email">\${result.email}</div>
                                    <div class="bulk-status">\${isValid ? '✅' : '❌'}</div>
                                </div>
                            \`;
                        });

                        html += '</div>';
                        resultsDiv.innerHTML = html;
                        resultsDiv.classList.remove('hidden');
                    }

                    // Receber mensagens do VS Code
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        switch (message.command) {
                            case 'emailValidated':
                                if (message.success) {
                                    displaySingleResult(message.email, message.validation);
                                }
                                break;
                            case 'bulkEmailsValidated':
                                if (message.success) {
                                    displayBulkResults(message.results, message.summary);
                                }
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}
