import * as vscode from 'vscode';
import * as fs from 'fs';
import { PixGenerator, PixData } from '../utils/pixGenerator';

/**
 * Provider for the PIX generator webview panel
 */
export class PixPanelProvider {    /**
     * Track the currently active panels. Only allow a single panel to exist at a time.
     */
    public static currentPanel: PixPanelProvider | undefined;

    public static readonly viewType = 'pixGenerator';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (PixPanelProvider.currentPanel) {
            PixPanelProvider.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            PixPanelProvider.viewType,
            'Gerador de PIX QR Code',
            column ?? vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'src', 'templates')
                ]
            }
        );

        PixPanelProvider.currentPanel = new PixPanelProvider(panel, extensionUri);
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
                    case 'validatePixKey':
                        this._validatePixKey(message.pixKey);
                        return;
                    case 'generatePix':
                        this._generatePix(message.data);
                        return;
                    case 'copyToClipboard':
                        this._copyToClipboard(message.text);
                        return;
                    case 'copyImageToClipboard':
                        this._copyImageToClipboard(message.dataUrl);
                        return;
                    case 'downloadQRCode':
                        this._downloadQRCode(message.dataUrl);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    /**
     * Validates a PIX key and sends the result to the webview
     */
    private _validatePixKey(pixKey: string) {
        const validation = PixGenerator.validatePixKey(pixKey);
        this._panel.webview.postMessage({
            command: 'pixKeyValidation',
            validation: validation
        });
    }

    /**
     * Generates a PIX QR code and sends the result to the webview
     */
    private async _generatePix(data: PixData) {
        try {
            const validation = PixGenerator.validatePixKey(data.pixKey);
            if (!validation.isValid) {
                throw new Error('Chave PIX inválida. Verifique o formato da chave.');
            }

            const pixCode = PixGenerator.generatePixCode(data);
            const qrCodeDataUrl = await PixGenerator.generatePixQRCode(data);

            this._panel.webview.postMessage({
                command: 'pixGenerated',
                pixCode: pixCode,
                qrCodeDataUrl: qrCodeDataUrl
            });

            vscode.window.showInformationMessage('PIX QR Code gerado com sucesso!');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao gerar PIX';
            this._panel.webview.postMessage({
                command: 'error',
                message: errorMessage
            });
            vscode.window.showErrorMessage(`Erro ao gerar PIX: ${errorMessage}`);
        }
    }

    /**
     * Copies text to clipboard
     */
    private async _copyToClipboard(text: string) {
        try {
            await vscode.env.clipboard.writeText(text);
            vscode.window.showInformationMessage('Código PIX copiado para a área de transferência!');        } catch (error) {
            console.error('Erro ao copiar código PIX:', error);
            vscode.window.showErrorMessage('Erro ao copiar código PIX para a área de transferência.');
        }
    }

    /**
     * Copies image to clipboard (currently shows a message as VS Code API doesn't support image clipboard)
     */
    private async _copyImageToClipboard(dataUrl: string) {
        // VS Code API doesn't currently support copying images to clipboard
        // We'll show a message instead
        vscode.window.showInformationMessage(
            'Para copiar a imagem, clique com o botão direito no QR Code e selecione "Copiar Imagem".'
        );
    }

    /**
     * Downloads the QR code image
     */
    private async _downloadQRCode(dataUrl: string) {
        try {
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file('pix-qrcode.png'),
                filters: {
                    'Imagens PNG': ['png']
                }
            });

            if (saveUri) {
                // Convert data URL to buffer
                const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                
                // Write to file
                await vscode.workspace.fs.writeFile(saveUri, buffer);
                vscode.window.showInformationMessage(`QR Code salvo em: ${saveUri.fsPath}`);
            }        } catch (error) {
            console.error('Erro ao salvar QR Code:', error);
            vscode.window.showErrorMessage('Erro ao salvar QR Code.');
        }
    }

    public dispose() {
        PixPanelProvider.currentPanel = undefined;

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
        // Get the path to the HTML file
        const htmlPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'src', 'templates', 'pix-generator.html');
        
        try {
            // Read the HTML file
            const htmlContent = fs.readFileSync(htmlPathOnDisk.fsPath, 'utf8');
            return htmlContent;
        } catch (error) {
            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Erro</title>
                </head>
                <body>
                    <h1>Erro ao carregar o gerador de PIX</h1>
                    <p>Não foi possível carregar o template HTML.</p>
                    <p>Erro: ${error}</p>
                </body>
                </html>
            `;
        }
    }
}
