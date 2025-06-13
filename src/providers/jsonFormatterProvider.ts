import * as vscode from 'vscode';

/**
 * Provider for the JSON formatter webview panel
 */
export class JsonFormatterProvider {
    /**
     * Track the currently active panels. Only allow a single panel to exist at a time.
     */
    public static currentPanel: JsonFormatterProvider | undefined;

    public static readonly viewType = 'jsonFormatter';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (JsonFormatterProvider.currentPanel) {
            JsonFormatterProvider.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            JsonFormatterProvider.viewType,
            'Formatador JSON',
            column ?? vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'src', 'templates')
                ]
            }
        );

        JsonFormatterProvider.currentPanel = new JsonFormatterProvider(panel, extensionUri);
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
                    case 'formatJson':
                        this._formatJson(message.json);
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
     * Formats JSON and sends the result to the webview
     */
    private _formatJson(jsonString: string) {
        try {
            const parsed = JSON.parse(jsonString);
            const formatted = JSON.stringify(parsed, null, 2);
            
            this._panel.webview.postMessage({
                command: 'jsonFormatted',
                formattedJson: formatted,
                isValid: true
            });
        } catch (error) {
            this._panel.webview.postMessage({
                command: 'jsonFormatted',
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                isValid: false
            });
        }
    }

    /**
     * Copies text to clipboard
     */
    private async _copyToClipboard(text: string) {
        try {
            await vscode.env.clipboard.writeText(text);
            vscode.window.showInformationMessage('JSON copiado para a área de transferência!');
        } catch (error) {
            console.error('Erro ao copiar JSON:', error);
            vscode.window.showErrorMessage('Erro ao copiar JSON para a área de transferência.');
        }
    }

    public dispose() {
        JsonFormatterProvider.currentPanel = undefined;

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
                <title>Formatador JSON</title>
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
                        height: 200px;
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
                    <h1>📄 Formatador JSON</h1>
                    
                    <div class="form-group">
                        <label for="inputJson">JSON de Entrada</label>
                        <textarea id="inputJson" placeholder="Cole aqui o JSON que deseja formatar..."></textarea>
                    </div>

                    <div class="form-group">
                        <button type="button" class="button" onclick="formatJson()">Formatar JSON</button>
                        <button type="button" class="button secondary" onclick="clearAll()">Limpar</button>
                    </div>

                    <div id="messages"></div>

                    <div class="form-group">
                        <label for="outputJson">JSON Formatado</label>
                        <div class="textarea-container">
                            <textarea id="outputJson" readonly placeholder="O JSON formatado aparecerá aqui..."></textarea>
                            <button type="button" class="button copy-button hidden" id="copyButton" onclick="copyFormatted()">📋 Copiar</button>
                        </div>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function formatJson() {
                        const input = document.getElementById('inputJson').value.trim();
                        if (!input) {
                            showMessage('Por favor, insira um JSON para formatar.', 'error');
                            return;
                        }

                        vscode.postMessage({
                            command: 'formatJson',
                            json: input
                        });
                    }

                    function copyFormatted() {
                        const output = document.getElementById('outputJson').value;
                        if (output) {
                            vscode.postMessage({
                                command: 'copyToClipboard',
                                text: output
                            });
                        }
                    }

                    function clearAll() {
                        document.getElementById('inputJson').value = '';
                        document.getElementById('outputJson').value = '';
                        document.getElementById('copyButton').classList.add('hidden');
                        clearMessages();
                    }

                    function showMessage(message, type) {
                        const messagesDiv = document.getElementById('messages');
                        messagesDiv.innerHTML = \`<div class="\${type}">\${message}</div>\`;
                    }

                    function clearMessages() {
                        document.getElementById('messages').innerHTML = '';
                    }

                    // Receber mensagens do VS Code
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        switch (message.command) {
                            case 'jsonFormatted':
                                if (message.isValid) {
                                    document.getElementById('outputJson').value = message.formattedJson;
                                    document.getElementById('copyButton').classList.remove('hidden');
                                    showMessage('JSON formatado com sucesso!', 'success');
                                } else {
                                    document.getElementById('outputJson').value = '';
                                    document.getElementById('copyButton').classList.add('hidden');
                                    showMessage('Erro no JSON: ' + message.error, 'error');
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
