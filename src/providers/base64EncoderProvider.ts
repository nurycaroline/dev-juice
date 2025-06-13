import * as vscode from 'vscode';

/**
 * Provider for the Base64 encoder/decoder webview panel
 */
export class Base64EncoderProvider {
    /**
     * Track the currently active panels. Only allow a single panel to exist at a time.
     */
    public static currentPanel: Base64EncoderProvider | undefined;

    public static readonly viewType = 'base64Encoder';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (Base64EncoderProvider.currentPanel) {
            Base64EncoderProvider.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            Base64EncoderProvider.viewType,
            'Codificador Base64',
            column ?? vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'src', 'templates')
                ]
            }
        );

        Base64EncoderProvider.currentPanel = new Base64EncoderProvider(panel, extensionUri);
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
                    case 'encode':
                        this._encodeBase64(message.text);
                        return;
                    case 'decode':
                        this._decodeBase64(message.text);
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
     * Encodes text to Base64
     */
    private _encodeBase64(text: string) {
        try {
            const encoded = Buffer.from(text, 'utf8').toString('base64');
            this._panel.webview.postMessage({
                command: 'encoded',
                result: encoded,
                success: true
            });
        } catch (error) {
            this._panel.webview.postMessage({
                command: 'encoded',
                error: 'Erro ao codificar texto',
                success: false
            });
        }
    }

    /**
     * Decodes Base64 to text
     */
    private _decodeBase64(base64: string) {
        try {
            const decoded = Buffer.from(base64, 'base64').toString('utf8');
            this._panel.webview.postMessage({
                command: 'decoded',
                result: decoded,
                success: true
            });
        } catch (error) {
            this._panel.webview.postMessage({
                command: 'decoded',
                error: 'Erro ao decodificar Base64 - verifique se o texto está em formato Base64 válido',
                success: false
            });
        }
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
        Base64EncoderProvider.currentPanel = undefined;

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
                <title>Codificador Base64</title>
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

                    .section {
                        margin-bottom: 30px;
                        padding: 20px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 5px;
                        border: 1px solid var(--vscode-panel-border);
                    }

                    .section h2 {
                        margin-top: 0;
                        color: var(--vscode-descriptionForeground);
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

                    textarea {
                        width: 100%;
                        height: 120px;
                        padding: 8px 12px;
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 3px;
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        font-family: var(--vscode-editor-font-family);
                        font-size: 12px;
                        box-sizing: border-box;
                        resize: vertical;
                    }

                    textarea:focus {
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

                    .button.secondary:hover {
                        background-color: var(--vscode-button-secondaryHoverBackground);
                    }

                    .error {
                        color: var(--vscode-errorForeground);
                        background-color: var(--vscode-inputValidation-errorBackground);
                        border: 1px solid var(--vscode-inputValidation-errorBorder);
                        padding: 8px;
                        border-radius: 3px;
                        margin: 10px 0;
                    }

                    .success {
                        color: var(--vscode-terminal-ansiGreen);
                        background-color: var(--vscode-diffEditor-insertedTextBackground);
                        border: 1px solid var(--vscode-diffEditor-insertedLineBackground);
                        padding: 8px;
                        border-radius: 3px;
                        margin: 10px 0;
                    }

                    .hidden {
                        display: none;
                    }

                    .textarea-container {
                        position: relative;
                    }

                    .copy-button {
                        position: absolute;
                        top: 5px;
                        right: 5px;
                        font-size: 12px;
                        padding: 5px 10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🔐 Codificador Base64</h1>
                    
                    <div class="section">
                        <h2>Codificar para Base64</h2>
                        <div class="form-group">
                            <label for="textInput">Texto para Codificar</label>
                            <textarea id="textInput" placeholder="Digite o texto que deseja codificar em Base64..."></textarea>
                        </div>

                        <div class="form-group">
                            <button type="button" class="button" onclick="encodeText()">Codificar</button>
                            <button type="button" class="button secondary" onclick="clearEncode()">Limpar</button>
                        </div>

                        <div id="encodeMessages"></div>

                        <div class="form-group">
                            <label for="base64Output">Base64 Codificado</label>
                            <div class="textarea-container">
                                <textarea id="base64Output" readonly placeholder="O texto codificado em Base64 aparecerá aqui..."></textarea>
                                <button type="button" class="button copy-button hidden" id="copyEncoded" onclick="copyEncoded()">📋 Copiar</button>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <h2>Decodificar Base64</h2>
                        <div class="form-group">
                            <label for="base64Input">Base64 para Decodificar</label>
                            <textarea id="base64Input" placeholder="Cole aqui o texto em Base64 que deseja decodificar..."></textarea>
                        </div>

                        <div class="form-group">
                            <button type="button" class="button" onclick="decodeText()">Decodificar</button>
                            <button type="button" class="button secondary" onclick="clearDecode()">Limpar</button>
                        </div>

                        <div id="decodeMessages"></div>

                        <div class="form-group">
                            <label for="textOutput">Texto Decodificado</label>
                            <div class="textarea-container">
                                <textarea id="textOutput" readonly placeholder="O texto decodificado aparecerá aqui..."></textarea>
                                <button type="button" class="button copy-button hidden" id="copyDecoded" onclick="copyDecoded()">📋 Copiar</button>
                            </div>
                        </div>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function encodeText() {
                        const input = document.getElementById('textInput').value;
                        if (!input) {
                            showMessage('encodeMessages', 'Por favor, insira um texto para codificar.', 'error');
                            return;
                        }

                        vscode.postMessage({
                            command: 'encode',
                            text: input
                        });
                    }

                    function decodeText() {
                        const input = document.getElementById('base64Input').value.trim();
                        if (!input) {
                            showMessage('decodeMessages', 'Por favor, insira um texto Base64 para decodificar.', 'error');
                            return;
                        }

                        vscode.postMessage({
                            command: 'decode',
                            text: input
                        });
                    }

                    function copyEncoded() {
                        const output = document.getElementById('base64Output').value;
                        if (output) {
                            vscode.postMessage({
                                command: 'copyToClipboard',
                                text: output
                            });
                        }
                    }

                    function copyDecoded() {
                        const output = document.getElementById('textOutput').value;
                        if (output) {
                            vscode.postMessage({
                                command: 'copyToClipboard',
                                text: output
                            });
                        }
                    }

                    function clearEncode() {
                        document.getElementById('textInput').value = '';
                        document.getElementById('base64Output').value = '';
                        document.getElementById('copyEncoded').classList.add('hidden');
                        clearMessages('encodeMessages');
                    }

                    function clearDecode() {
                        document.getElementById('base64Input').value = '';
                        document.getElementById('textOutput').value = '';
                        document.getElementById('copyDecoded').classList.add('hidden');
                        clearMessages('decodeMessages');
                    }

                    function showMessage(containerId, message, type) {
                        const messagesDiv = document.getElementById(containerId);
                        messagesDiv.innerHTML = \`<div class="\${type}">\${message}</div>\`;
                    }

                    function clearMessages(containerId) {
                        document.getElementById(containerId).innerHTML = '';
                    }

                    // Receber mensagens do VS Code
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        switch (message.command) {
                            case 'encoded':
                                if (message.success) {
                                    document.getElementById('base64Output').value = message.result;
                                    document.getElementById('copyEncoded').classList.remove('hidden');
                                    showMessage('encodeMessages', 'Texto codificado com sucesso!', 'success');
                                } else {
                                    showMessage('encodeMessages', message.error, 'error');
                                }
                                break;
                            case 'decoded':
                                if (message.success) {
                                    document.getElementById('textOutput').value = message.result;
                                    document.getElementById('copyDecoded').classList.remove('hidden');
                                    showMessage('decodeMessages', 'Base64 decodificado com sucesso!', 'success');
                                } else {
                                    showMessage('decodeMessages', message.error, 'error');
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
