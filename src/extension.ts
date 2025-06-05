// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DevHelperProvider } from './providers/devHelperProvider';
import { CNPJPanelProvider } from './providers/cnpjPanelProvider';
import { CPFPanelProvider } from './providers/cpfPanelProvider';
import { UUIDPanelProvider } from './providers/uuidPanelProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "dev-helper" is now active!');

	// Register the tree data provider for the view
	const devHelperProvider = new DevHelperProvider();
	vscode.window.registerTreeDataProvider('devHelperExplorer', devHelperProvider);

	// Register commands
	
	// Hello World command (from template)
	const helloWorldDisposable = vscode.commands.registerCommand('dev-helper.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Dev Helper!');
	});

	// Generate CNPJ command - now opens the webview panel
	const generateCNPJDisposable = vscode.commands.registerCommand('dev-helper.generateCNPJ', () => {
		CNPJPanelProvider.createOrShow(context.extensionUri);
	});

	// Generate CPF command
	const generateCPFDisposable = vscode.commands.registerCommand('dev-helper.generateCPF', () => {
		CPFPanelProvider.createOrShow(context.extensionUri);
	});

	// Generate UUID command
	const generateUUIDDisposable = vscode.commands.registerCommand('dev-helper.generateUUID', () => {
		UUIDPanelProvider.createOrShow(context.extensionUri);
	});

	// Add the commands to the extension context
	context.subscriptions.push(
		helloWorldDisposable, 
		generateCNPJDisposable,
		generateCPFDisposable,
		generateUUIDDisposable
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
