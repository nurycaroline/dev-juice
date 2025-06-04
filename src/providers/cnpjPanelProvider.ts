import * as vscode from 'vscode';
import * as fs from 'fs';
import { generateCNPJ, formatCNPJ } from '../utils/cnpjGenerator';

/**
 * Manages CNPJ Generator webview panels
 */
export class CNPJPanelProvider {
	/**
	 * Track the current panel. Only allow a single panel to exist at a time.
	 */
	private static _currentPanel: CNPJPanelProvider | undefined;

	/**
	 * Get the current panel
	 */
	public static get currentPanel(): CNPJPanelProvider | undefined {
		return this._currentPanel;
	}
	
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private readonly _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (CNPJPanelProvider._currentPanel) {
			CNPJPanelProvider._currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			'cnpjGenerator',
			'Gerador de CNPJ',
			column ?? vscode.ViewColumn.One,
			{
				// Enable scripts in the webview
				enableScripts: true,
				// Restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'resources')],
				retainContextWhenHidden: true
			}
		);

		CNPJPanelProvider._currentPanel = new CNPJPanelProvider(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);        // Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			async message => {
				switch (message.command) {
					case 'generateCNPJ': {
						// Generate both formatted and unformatted versions of the same CNPJ
						const rawCNPJ = generateCNPJ(false);
						const formattedCNPJ = formatCNPJ(rawCNPJ);

						this._panel.webview.postMessage({
							command: 'cnpjGenerated',
							formattedCNPJ,
							unformattedCNPJ: rawCNPJ
						});
						break;
					}
					case 'copyCNPJ': {
						vscode.env.clipboard.writeText(message.cnpj);
						vscode.window.showInformationMessage('CNPJ copiado para o clipboard!');
						break;
					}
				}
			},
			null,
			this._disposables
		);
	} public dispose() {
		CNPJPanelProvider._currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	} private _update() {
		const webview = this._panel.webview;
		this._panel.title = "Gerador de CNPJ";
		this._panel.webview.html = this._getHtmlForWebview(webview);
	}
	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the HTML template path
		const templatePath = vscode.Uri.joinPath(this._extensionUri, 'src', 'templates', 'cnpj-generator.html');

		// Read the HTML file
		let html = fs.readFileSync(templatePath.fsPath, 'utf8');

		return html;
	}
}
