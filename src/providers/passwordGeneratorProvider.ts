import * as vscode from 'vscode';
import { loadTemplate } from '../utils/templateLoader';

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
    }    private _getHtmlForWebview(webview: vscode.Webview) {
        return loadTemplate(this._extensionUri, 'password-generator.html');
    }
}
