import * as vscode from 'vscode';
import { insertText } from '../utils/insertUtils';
import { loadTemplate } from '../utils/templateLoader';

export class UrlEncoderProvider {
    // Making currentPanel readonly to fix SonarLint warning
    private static currentPanel: vscode.WebviewPanel | undefined;

    public static createOrShow(extensionUri: vscode.Uri): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (UrlEncoderProvider.currentPanel) {
            UrlEncoderProvider.currentPanel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            'urlEncoder',
            'URL Encoder/Decoder',
            column ?? vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: []
            }
        );

        UrlEncoderProvider.currentPanel = panel;        // Set the webview's initial html content
        panel.webview.html = UrlEncoderProvider.getWebviewContent(extensionUri);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'encode':
                        UrlEncoderProvider.handleEncode(message.text);
                        break;
                    case 'decode':
                        UrlEncoderProvider.handleDecode(message.text);
                        break;
                    case 'insertInEditor':
                        insertText(message.text);
                        break;
                    case 'copyToClipboard':
                        vscode.env.clipboard.writeText(message.text);
                        vscode.window.showInformationMessage('URL copiada para a área de transferência!');
                        break;
                }
            },
            undefined
        );

        // Listen for when the panel is disposed
        panel.onDidDispose(
            () => {
                UrlEncoderProvider.currentPanel = undefined;
            },
            null
        );
    }

    private static handleEncode(text: string): void {
        if (!UrlEncoderProvider.currentPanel) {
            return;
        }

        try {
            const encoded = encodeURIComponent(text);
            UrlEncoderProvider.currentPanel.webview.postMessage({ 
                command: 'encodeResult', 
                result: encoded 
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao codificar URL: ${error}`);
        }
    }

    private static handleDecode(text: string): void {
        if (!UrlEncoderProvider.currentPanel) {
            return;
        }

        try {
            const decoded = decodeURIComponent(text);
            UrlEncoderProvider.currentPanel.webview.postMessage({ 
                command: 'decodeResult', 
                result: decoded 
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Erro ao decodificar URL: ${error}`);
            UrlEncoderProvider.currentPanel.webview.postMessage({ 
                command: 'decodeResult', 
                result: 'Erro: URL inválida para decodificação' 
            });
        }
    }    private static getWebviewContent(extensionUri: vscode.Uri): string {
        return loadTemplate(extensionUri, 'url-encoder');
    }
}
