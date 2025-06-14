import * as vscode from 'vscode';
import { loadTemplate } from '../utils/templateLoader';

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
    }    private _getHtmlForWebview(webview: vscode.Webview) {
        return loadTemplate(this._extensionUri, 'base64-encoder');
    }
}
