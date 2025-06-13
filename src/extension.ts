// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DevHelperProvider } from './providers/devHelperProvider';
import { CNPJPanelProvider } from './providers/cnpjPanelProvider';
import { CPFPanelProvider } from './providers/cpfPanelProvider';
import { UUIDPanelProvider } from './providers/uuidPanelProvider';
import { PixPanelProvider } from './providers/pixPanelProvider';
import { JsonFormatterProvider } from './providers/jsonFormatterProvider';
import { Base64EncoderProvider } from './providers/base64EncoderProvider';
import { PasswordGeneratorProvider } from './providers/passwordGeneratorProvider';
import { HashGeneratorProvider } from './providers/hashGeneratorProvider';
import { EmailValidatorProvider } from './providers/emailValidatorProvider';
import { ColorConverterProvider } from './providers/colorConverterProvider';
import { DateCalculatorProvider } from './providers/dateCalculatorProvider';
import { UrlEncoderProvider } from './providers/urlEncoderProvider';
import { QrReaderProvider } from './providers/qrReaderProvider';
import { PixDecoderProvider } from './providers/pixDecoderProvider';
import { insertCNPJ, insertCPF, insertUUID } from './utils/insertUtils';

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

	// Generate PIX command
	const generatePixDisposable = vscode.commands.registerCommand('dev-helper.generatePix', () => {
		PixPanelProvider.createOrShow(context.extensionUri);
	});

	// Format JSON command
	const formatJsonDisposable = vscode.commands.registerCommand('dev-helper.formatJson', () => {
		JsonFormatterProvider.createOrShow(context.extensionUri);
	});

	// Base64 Encoder command
	const base64EncoderDisposable = vscode.commands.registerCommand('dev-helper.base64Encoder', () => {
		Base64EncoderProvider.createOrShow(context.extensionUri);
	});

	// Hash Generator command
	const hashGeneratorDisposable = vscode.commands.registerCommand('dev-helper.hashGenerator', () => {
		HashGeneratorProvider.createOrShow(context.extensionUri);
	});

	// Email Validator command
	const emailValidatorDisposable = vscode.commands.registerCommand('dev-helper.emailValidator', () => {
		EmailValidatorProvider.createOrShow(context.extensionUri);
	});

	// Password Generator command
	const passwordGeneratorDisposable = vscode.commands.registerCommand('dev-helper.passwordGenerator', () => {
		PasswordGeneratorProvider.createOrShow(context.extensionUri);
	});

	// Color Converter command
	const colorConverterDisposable = vscode.commands.registerCommand('dev-helper.colorConverter', () => {
		ColorConverterProvider.createOrShow(context.extensionUri);
	});

	// Date Calculator command
	const dateCalculatorDisposable = vscode.commands.registerCommand('dev-helper.dateCalculator', () => {
		DateCalculatorProvider.createOrShow(context.extensionUri);
	});

	// URL Encoder command
	const urlEncoderDisposable = vscode.commands.registerCommand('dev-helper.urlEncoder', () => {
		UrlEncoderProvider.createOrShow(context.extensionUri);
	});

	// QR Reader command
	const qrReaderDisposable = vscode.commands.registerCommand('dev-helper.qrReader', () => {
		QrReaderProvider.createOrShow(context.extensionUri);
	});

	// PIX Decoder command
	const pixDecoderDisposable = vscode.commands.registerCommand('dev-helper.pixDecoder', () => {
		PixDecoderProvider.createOrShow(context.extensionUri);
	});

	// Comandos para inserir valores gerados diretamente no editor
	
	// Inserir CNPJ formatado
	const insertCNPJFormattedDisposable = vscode.commands.registerCommand('dev-helper.insertCNPJFormatted', () => {
		insertCNPJ(true);
	});

	// Inserir CNPJ não formatado
	const insertCNPJUnformattedDisposable = vscode.commands.registerCommand('dev-helper.insertCNPJUnformatted', () => {
		insertCNPJ(false);
	});

	// Inserir CPF formatado
	const insertCPFFormattedDisposable = vscode.commands.registerCommand('dev-helper.insertCPFFormatted', () => {
		insertCPF(true);
	});

	// Inserir CPF não formatado
	const insertCPFUnformattedDisposable = vscode.commands.registerCommand('dev-helper.insertCPFUnformatted', () => {
		insertCPF(false);
	});

	// Inserir UUID formatado
	const insertUUIDFormattedDisposable = vscode.commands.registerCommand('dev-helper.insertUUIDFormatted', () => {
		insertUUID(true);
	});

	// Inserir UUID não formatado
	const insertUUIDUnformattedDisposable = vscode.commands.registerCommand('dev-helper.insertUUIDUnformatted', () => {
		insertUUID(false);
	});

	// Add the commands to the extension context
	context.subscriptions.push(
		helloWorldDisposable, 
		generateCNPJDisposable,
		generateCPFDisposable,
		generateUUIDDisposable,
		generatePixDisposable,
		formatJsonDisposable,
		base64EncoderDisposable,
		hashGeneratorDisposable,
		emailValidatorDisposable,
		passwordGeneratorDisposable,
		colorConverterDisposable,
		dateCalculatorDisposable,
		urlEncoderDisposable,
		qrReaderDisposable,
		pixDecoderDisposable,
		insertCNPJFormattedDisposable,
		insertCNPJUnformattedDisposable,
		insertCPFFormattedDisposable,
		insertCPFUnformattedDisposable,
		insertUUIDFormattedDisposable,
		insertUUIDUnformattedDisposable
	);
}

// This method is called when your extension is deactivated
export function deactivate() {
	// Extension cleanup if needed
}
