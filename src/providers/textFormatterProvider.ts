import * as vscode from 'vscode';
import { insertText } from '../utils/insertUtils';

export class TextFormatterProvider {
    // Making currentPanel readonly to fix SonarLint warning
    private static currentPanel: vscode.WebviewPanel | undefined;

    public static createOrShow(extensionUri: vscode.Uri): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (TextFormatterProvider.currentPanel) {
            TextFormatterProvider.currentPanel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            'textFormatter',
            'Formatação de Texto',
            column ?? vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: []
            }
        );

        TextFormatterProvider.currentPanel = panel;

        // Set the webview's initial html content
        panel.webview.html = TextFormatterProvider.getWebviewContent();

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'formatText':
                        TextFormatterProvider.handleFormatText(message.text, message.format);
                        break;
                    case 'insertInEditor':
                        insertText(message.text);
                        break;
                    case 'copyToClipboard':
                        vscode.env.clipboard.writeText(message.text);
                        vscode.window.showInformationMessage('Texto formatado copiado para a área de transferência!');
                        break;
                }
            },
            undefined
        );

        // Listen for when the panel is disposed
        panel.onDidDispose(
            () => {
                TextFormatterProvider.currentPanel = undefined;
            },
            null
        );
    }

    private static handleFormatText(text: string, format: string): void {
        const panel = TextFormatterProvider.currentPanel;
        if (!panel) {
            return;
        }

        try {
            const formattedText = TextFormatterProvider.formatText(text, format);
            panel.webview.postMessage({ 
                command: 'formatResult', 
                result: formattedText,
                format: format
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            vscode.window.showErrorMessage(`Erro ao formatar texto: ${errorMessage}`);
        }
    }

    private static formatText(text: string, format: string): string {
        if (!text) {
            return '';
        }

        switch (format) {
            case 'sentence':
                return TextFormatterProvider.toSentenceCase(text);
            case 'snake':
                return TextFormatterProvider.toSnakeCase(text);
            case 'camel':
                return TextFormatterProvider.toCamelCase(text);
            case 'kebab':
                return TextFormatterProvider.toKebabCase(text);
            case 'pascal':
                return TextFormatterProvider.toPascalCase(text);
            case 'lower':
                return text.toLowerCase();
            case 'upper':
                return text.toUpperCase();
            case 'capital':
                return TextFormatterProvider.toCapitalizedCase(text);
            case 'alternating':
                return TextFormatterProvider.toAlternatingCase(text);
            case 'inverse':
                return TextFormatterProvider.toInverseCase(text);
            default:
                return text;
        }
    }

    private static toSentenceCase(text: string): string {
        return text.toLowerCase().replace(/^\w/, c => c.toUpperCase());
    }

    private static toSnakeCase(text: string): string {
        return text
            .replace(/\W+/g, ' ')
            .split(' ')
            .map(word => word.toLowerCase())
            .filter(word => word.length > 0)
            .join('_');
    }

    private static toCamelCase(text: string): string {
        return text
            .replace(/\W+/g, ' ')
            .split(' ')
            .map((word, index) => {
                if (index === 0) {
                    return word.toLowerCase();
                }
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .filter(word => word.length > 0)
            .join('');
    }

    private static toKebabCase(text: string): string {
        return text
            .replace(/\W+/g, ' ')
            .split(' ')
            .map(word => word.toLowerCase())
            .filter(word => word.length > 0)
            .join('-');
    }

    private static toPascalCase(text: string): string {
        return text
            .replace(/\W+/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .filter(word => word.length > 0)
            .join('');
    }

    private static toCapitalizedCase(text: string): string {
        return text
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }    private static toAlternatingCase(text: string): string {
        const letterRegex = /[a-zA-Z]/;
        return text
            .split('')
            .map((char, index) => {
                if (letterRegex.exec(char)) {
                    return index % 2 === 0 ? char.toLowerCase() : char.toUpperCase();
                }
                return char;
            })
            .join('');
    }

    private static toInverseCase(text: string): string {
        return text
            .split('')
            .map(char => {
                if (char === char.toUpperCase()) {
                    return char.toLowerCase();
                } else {
                    return char.toUpperCase();
                }
            })
            .join('');
    }

    private static getWebviewContent(): string {
        return `<!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Formatação de Texto</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                    padding: 20px;
                    max-width: 1000px;
                    margin: 0 auto;
                    line-height: 1.6;
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                }

                .container {
                    background-color: var(--vscode-editor-background);
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    color: var(--vscode-foreground);
                    margin-bottom: 20px;
                    text-align: center;
                }

                .section {
                    margin-bottom: 30px;
                    padding: 20px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                    background-color: var(--vscode-input-background);
                }

                .section h2 {
                    margin-top: 0;
                    color: var(--vscode-foreground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 10px;
                }

                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                    color: var(--vscode-foreground);
                }

                textarea {
                    width: 100%;
                    min-height: 80px;
                    padding: 10px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    resize: vertical;
                    box-sizing: border-box;
                }

                textarea:focus {
                    outline: none;
                    border-color: var(--vscode-focusBorder);
                }

                .format-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }

                .format-item {
                    background-color: var(--vscode-input-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 6px;
                    padding: 15px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                }

                .format-item:hover {
                    border-color: var(--vscode-focusBorder);
                    background-color: var(--vscode-list-hoverBackground);
                }

                .format-item.selected {
                    border-color: var(--vscode-focusBorder);
                    background-color: var(--vscode-list-activeSelectionBackground);
                }

                .format-title {
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: var(--vscode-foreground);
                }

                .format-example {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                    background-color: var(--vscode-textCodeBlock-background);
                    padding: 5px 8px;
                    border-radius: 3px;
                    margin-bottom: 8px;
                }

                .format-description {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                    font-style: italic;
                }

                .result-area {
                    margin-top: 20px;
                    padding: 15px;
                    background-color: var(--vscode-textCodeBlock-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                    display: none;
                }

                .result-preview {
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    color: var(--vscode-foreground);
                    word-break: break-all;
                    white-space: pre-wrap;
                    margin: 10px 0;
                    padding: 10px;
                    background-color: var(--vscode-input-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    min-height: 40px;
                }

                button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    margin: 5px;
                }

                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }

                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .secondary-btn {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }

                .secondary-btn:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }

                .button-group {
                    margin-top: 15px;
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .info {
                    background-color: var(--vscode-editorInfo-background);
                    border-left: 4px solid var(--vscode-editorInfo-foreground);
                    padding: 10px;
                    margin: 15px 0;
                    border-radius: 0 4px 4px 0;
                }

                .example-text {
                    font-style: italic;
                    color: var(--vscode-descriptionForeground);
                    margin-top: 10px;
                }

                @media (max-width: 600px) {
                    body {
                        padding: 10px;
                    }
                    
                    .container {
                        padding: 15px;
                    }
                    
                    .format-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .button-group {
                        flex-direction: column;
                    }
                    
                    button {
                        width: 100%;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>✏️ Formatação de Texto</h1>
                
                <div class="section">
                    <h2>📝 Texto de Entrada</h2>
                    <label for="inputText">Digite ou cole o texto que deseja formatar:</label>
                    <textarea id="inputText" placeholder="Digite seu texto aqui..."></textarea>
                    
                    <div class="button-group">
                        <button onclick="clearInput()">Limpar</button>
                        <button class="secondary-btn" onclick="loadExample()">Texto de Exemplo</button>
                    </div>
                    
                    <div class="example-text">
                        Exemplo: "Hello World Example Text" será formatado conforme a opção selecionada
                    </div>
                </div>

                <div class="section">
                    <h2>🎨 Formatos Disponíveis</h2>
                    <p>Clique em um formato para aplicar ao seu texto:</p>
                    
                    <div class="format-grid">
                        <div class="format-item" onclick="selectFormat('sentence')" data-format="sentence">
                            <div class="format-title">Sentence case</div>
                            <div class="format-example">Hello world example text</div>
                            <div class="format-description">Primeira letra maiúscula, resto minúsculo</div>
                        </div>
                        
                        <div class="format-item" onclick="selectFormat('snake')" data-format="snake">
                            <div class="format-title">snake_case</div>
                            <div class="format-example">hello_world_example_text</div>
                            <div class="format-description">Palavras separadas por underscores</div>
                        </div>
                        
                        <div class="format-item" onclick="selectFormat('camel')" data-format="camel">
                            <div class="format-title">camelCase</div>
                            <div class="format-example">helloWorldExampleText</div>
                            <div class="format-description">Primeira palavra minúscula, demais capitalizadas</div>
                        </div>
                        
                        <div class="format-item" onclick="selectFormat('kebab')" data-format="kebab">
                            <div class="format-title">kebab-case</div>
                            <div class="format-example">hello-world-example-text</div>
                            <div class="format-description">Palavras separadas por hífens</div>
                        </div>
                        
                        <div class="format-item" onclick="selectFormat('pascal')" data-format="pascal">
                            <div class="format-title">PascalCase</div>
                            <div class="format-example">HelloWorldExampleText</div>
                            <div class="format-description">Todas as palavras capitalizadas</div>
                        </div>
                        
                        <div class="format-item" onclick="selectFormat('lower')" data-format="lower">
                            <div class="format-title">lower case</div>
                            <div class="format-example">hello world example text</div>
                            <div class="format-description">Todas as letras minúsculas</div>
                        </div>
                        
                        <div class="format-item" onclick="selectFormat('upper')" data-format="upper">
                            <div class="format-title">UPPER CASE</div>
                            <div class="format-example">HELLO WORLD EXAMPLE TEXT</div>
                            <div class="format-description">Todas as letras maiúsculas</div>
                        </div>
                        
                        <div class="format-item" onclick="selectFormat('capital')" data-format="capital">
                            <div class="format-title">Capitalized Case</div>
                            <div class="format-example">Hello World Example Text</div>
                            <div class="format-description">Primeira letra de cada palavra maiúscula</div>
                        </div>
                        
                        <div class="format-item" onclick="selectFormat('alternating')" data-format="alternating">
                            <div class="format-title">aLtErNaTiNg cAsE</div>
                            <div class="format-example">hElLo WoRlD eXaMpLe TeXt</div>
                            <div class="format-description">Letras alternadas entre maiúscula e minúscula</div>
                        </div>
                        
                        <div class="format-item" onclick="selectFormat('inverse')" data-format="inverse">
                            <div class="format-title">InVeRsE CaSe</div>
                            <div class="format-example">hELLO wORLD eXAMPLE tEXT</div>
                            <div class="format-description">Inverte maiúsculas e minúsculas</div>
                        </div>
                    </div>
                </div>

                <div id="resultArea" class="result-area">
                    <h3>📋 Resultado</h3>
                    <div id="resultPreview" class="result-preview"></div>
                    
                    <div class="button-group">
                        <button class="secondary-btn" onclick="copyResult()">Copiar</button>
                        <button class="secondary-btn" onclick="insertResult()">Inserir no Editor</button>
                        <button onclick="clearResult()">Limpar</button>
                    </div>
                </div>

                <div class="info">
                    <strong>💡 Dica:</strong> Esta ferramenta é útil para converter nomes de variáveis, funções, constantes e outros elementos de código entre diferentes convenções de nomenclatura.
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                let currentResult = '';
                let selectedFormat = '';

                function selectFormat(format) {
                    selectedFormat = format;
                    
                    // Remove selection from all items
                    document.querySelectorAll('.format-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    
                    // Add selection to clicked item
                    document.querySelector('[data-format="' + format + '"]').classList.add('selected');
                    
                    // Format text if there's input
                    const inputText = document.getElementById('inputText').value;
                    if (inputText.trim()) {
                        formatText(inputText, format);
                    }
                }

                function formatText(text, format) {
                    if (!text.trim()) {
                        document.getElementById('resultArea').style.display = 'none';
                        return;
                    }
                    
                    vscode.postMessage({
                        command: 'formatText',
                        text: text,
                        format: format
                    });
                }

                function clearInput() {
                    document.getElementById('inputText').value = '';
                    clearResult();
                }

                function loadExample() {
                    document.getElementById('inputText').value = 'Hello World Example Text';
                    
                    // Auto-format if a format is selected
                    if (selectedFormat) {
                        formatText('Hello World Example Text', selectedFormat);
                    }
                }

                function clearResult() {
                    document.getElementById('resultArea').style.display = 'none';
                    document.getElementById('resultPreview').textContent = '';
                    currentResult = '';
                }

                function copyResult() {
                    if (currentResult) {
                        vscode.postMessage({
                            command: 'copyToClipboard',
                            text: currentResult
                        });
                    }
                }

                function insertResult() {
                    if (currentResult) {
                        vscode.postMessage({
                            command: 'insertInEditor',
                            text: currentResult
                        });
                    }
                }

                // Listen for messages from the extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'formatResult':
                            currentResult = message.result;
                            document.getElementById('resultPreview').textContent = message.result;
                            document.getElementById('resultArea').style.display = 'block';
                            break;
                    }
                });

                // Auto-format on input change with debounce
                let formatTimeout;
                document.getElementById('inputText').addEventListener('input', function() {
                    clearTimeout(formatTimeout);
                    formatTimeout = setTimeout(() => {
                        if (this.value.trim() !== '' && selectedFormat) {
                            formatText(this.value, selectedFormat);
                        } else if (this.value.trim() === '') {
                            clearResult();
                        }
                    }, 300);
                });
            </script>
        </body>
        </html>`;
    }
}
