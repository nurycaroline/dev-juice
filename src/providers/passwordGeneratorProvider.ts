import * as vscode from 'vscode';

/**
 * Provider for the Password Generator webview panel
 */
export class PasswordGeneratorProvider {
    /**
     * Track the currently active panels. Only allow a single panel to exist at a time.
     */
    public static currentPanel: PasswordGeneratorProvider | undefined;

    public static readonly viewType = 'passwordGenerator';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (PasswordGeneratorProvider.currentPanel) {
            PasswordGeneratorProvider.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            PasswordGeneratorProvider.viewType,
            'Gerador de Senhas',
            column ?? vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'src', 'templates')
                ]
            }
        );

        PasswordGeneratorProvider.currentPanel = new PasswordGeneratorProvider(panel, extensionUri);
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
                    case 'generatePassword':
                        this._generatePassword(message.options);
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
     * Generates a password based on the provided options
     */
    private _generatePassword(options: any) {
        try {
            const charset = this._buildCharset(options);
            if (charset.length === 0) {
                this._panel.webview.postMessage({
                    command: 'passwordGenerated',
                    error: 'Selecione pelo menos um tipo de caractere',
                    success: false
                });
                return;
            }

            const password = this._createPassword(charset, options.length);
            
            this._panel.webview.postMessage({
                command: 'passwordGenerated',
                password: password,
                strength: this._calculateStrength(password, options),
                success: true
            });
        } catch (error) {
            console.error('Erro ao gerar senha:', error);
            this._panel.webview.postMessage({
                command: 'passwordGenerated',
                error: 'Erro ao gerar senha',
                success: false
            });
        }
    }

    /**
     * Builds the character set based on options
     */
    private _buildCharset(options: any): string {
        let charset = '';
        
        if (options.lowercase) {
            charset += 'abcdefghijklmnopqrstuvwxyz';
        }
        if (options.uppercase) {
            charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        }
        if (options.numbers) {
            charset += '0123456789';
        }
        if (options.symbols) {
            charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        }
        if (options.customChars) {
            charset += options.customChars;
        }
        
        return charset;
    }

    /**
     * Creates a password from the charset
     */
    private _createPassword(charset: string, length: number): string {
        let password = '';
        const crypto = require('crypto');
        
        for (let i = 0; i < length; i++) {
            const randomIndex = crypto.randomInt(0, charset.length);
            password += charset[randomIndex];
        }
        
        return password;
    }    /**
     * Calculates password strength
     */
    private _calculateStrength(password: string, options: any): string {
        let score = 0;
        
        // Length bonus
        if (password.length >= 8) {
            score += 1;
        }
        if (password.length >= 12) {
            score += 1;
        }
        if (password.length >= 16) {
            score += 1;
        }
        
        // Character variety bonus
        if (options.lowercase) {
            score += 1;
        }
        if (options.uppercase) {
            score += 1;
        }
        if (options.numbers) {
            score += 1;
        }
        if (options.symbols) {
            score += 2;
        }
        
        if (score <= 2) {
            return 'Fraca';
        }
        if (score <= 4) {
            return 'Média';
        }
        if (score <= 6) {
            return 'Forte';
        }
        return 'Muito Forte';
    }

    /**
     * Copies text to clipboard
     */
    private async _copyToClipboard(text: string) {
        try {
            await vscode.env.clipboard.writeText(text);
            vscode.window.showInformationMessage('Senha copiada para a área de transferência!');
        } catch (error) {
            console.error('Erro ao copiar senha:', error);
            vscode.window.showErrorMessage('Erro ao copiar senha para a área de transferência.');
        }
    }

    public dispose() {
        PasswordGeneratorProvider.currentPanel = undefined;

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
                <title>Gerador de Senhas</title>
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
                        max-width: 600px;
                        margin: 0 auto;
                    }

                    h1 {
                        color: var(--vscode-titleBar-activeForeground);
                        margin-bottom: 20px;
                        text-align: center;
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

                    input[type="checkbox"] {
                        width: auto;
                        margin-right: 8px;
                    }

                    input[type="range"] {
                        width: 100%;
                    }

                    input:focus, select:focus {
                        outline: none;
                        border-color: var(--vscode-focusBorder);
                    }

                    .checkbox-group {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }

                    .checkbox-item {
                        display: flex;
                        align-items: center;
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
                        width: 100%;
                    }

                    .button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }

                    .button.secondary {
                        background-color: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }

                    .button.secondary:hover {
                        background-color: var(--vscode-button-secondaryHoverBackground);
                    }

                    .result-section {
                        margin-top: 30px;
                        padding: 20px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 5px;
                        border: 1px solid var(--vscode-panel-border);
                    }

                    .password-display {
                        background-color: var(--vscode-textCodeBlock-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 3px;
                        padding: 15px;
                        font-family: var(--vscode-editor-font-family);
                        font-size: 16px;
                        word-break: break-all;
                        margin: 10px 0;
                        text-align: center;
                        position: relative;
                    }

                    .strength-indicator {
                        margin: 10px 0;
                        text-align: center;
                    }

                    .strength-weak { color: var(--vscode-errorForeground); }
                    .strength-medium { color: var(--vscode-terminal-ansiYellow); }
                    .strength-strong { color: var(--vscode-terminal-ansiGreen); }
                    .strength-very-strong { color: var(--vscode-terminal-ansiBrightGreen); }

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

                    .range-value {
                        font-weight: bold;
                        color: var(--vscode-terminal-ansiBlue);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🔐 Gerador de Senhas</h1>
                    
                    <div class="form-group">
                        <label for="length">Comprimento da Senha: <span id="lengthValue" class="range-value">12</span></label>
                        <input type="range" id="length" min="4" max="128" value="12" oninput="updateLengthValue()">
                    </div>

                    <div class="form-group">
                        <label>Tipos de Caracteres</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="checkbox" id="lowercase" checked>
                                <label for="lowercase">Letras minúsculas (a-z)</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="uppercase" checked>
                                <label for="uppercase">Letras maiúsculas (A-Z)</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="numbers" checked>
                                <label for="numbers">Números (0-9)</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="symbols">
                                <label for="symbols">Símbolos (!@#$%^&*)</label>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="customChars">Caracteres Personalizados (opcional)</label>
                        <input type="text" id="customChars" placeholder="Digite caracteres adicionais...">
                    </div>

                    <div class="form-group">
                        <button type="button" class="button" onclick="generatePassword()">🎲 Gerar Senha</button>
                    </div>

                    <div id="resultSection" class="result-section hidden">
                        <h3>Senha Gerada</h3>
                        
                        <div class="password-display" id="passwordDisplay"></div>

                        <div class="strength-indicator">
                            <strong>Força da Senha: <span id="strengthIndicator"></span></strong>
                        </div>

                        <div>
                            <button type="button" class="button secondary" onclick="copyPassword()">📋 Copiar Senha</button>
                            <button type="button" class="button" onclick="generatePassword()">🔄 Gerar Nova</button>
                        </div>
                    </div>

                    <div id="error" class="error hidden"></div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    let currentPassword = '';

                    function updateLengthValue() {
                        const length = document.getElementById('length').value;
                        document.getElementById('lengthValue').textContent = length;
                    }

                    function generatePassword() {
                        const options = {
                            length: parseInt(document.getElementById('length').value),
                            lowercase: document.getElementById('lowercase').checked,
                            uppercase: document.getElementById('uppercase').checked,
                            numbers: document.getElementById('numbers').checked,
                            symbols: document.getElementById('symbols').checked,
                            customChars: document.getElementById('customChars').value
                        };

                        vscode.postMessage({
                            command: 'generatePassword',
                            options: options
                        });
                    }

                    function copyPassword() {
                        if (currentPassword) {
                            vscode.postMessage({
                                command: 'copyToClipboard',
                                text: currentPassword
                            });
                        }
                    }

                    function showError(message) {
                        const errorDiv = document.getElementById('error');
                        errorDiv.textContent = message;
                        errorDiv.classList.remove('hidden');
                        document.getElementById('resultSection').classList.add('hidden');
                    }

                    function hideError() {
                        document.getElementById('error').classList.add('hidden');
                    }

                    // Receber mensagens do VS Code
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        switch (message.command) {
                            case 'passwordGenerated':
                                if (message.success) {
                                    currentPassword = message.password;
                                    document.getElementById('passwordDisplay').textContent = message.password;
                                    
                                    const strengthSpan = document.getElementById('strengthIndicator');
                                    strengthSpan.textContent = message.strength;
                                    
                                    // Apply strength color
                                    strengthSpan.className = '';
                                    switch (message.strength) {
                                        case 'Fraca':
                                            strengthSpan.classList.add('strength-weak');
                                            break;
                                        case 'Média':
                                            strengthSpan.classList.add('strength-medium');
                                            break;
                                        case 'Forte':
                                            strengthSpan.classList.add('strength-strong');
                                            break;
                                        case 'Muito Forte':
                                            strengthSpan.classList.add('strength-very-strong');
                                            break;
                                    }
                                    
                                    document.getElementById('resultSection').classList.remove('hidden');
                                    hideError();
                                } else {
                                    showError(message.error);
                                }
                                break;
                        }
                    });

                    // Gerar senha inicial
                    window.addEventListener('load', () => {
                        generatePassword();
                    });
                </script>
            </body>
            </html>
        `;
    }
}
