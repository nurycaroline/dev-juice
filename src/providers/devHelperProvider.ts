import * as vscode from 'vscode';

// Define a type alias for the event type to fix the SonarLint warning
type TreeDataEvent = DevToolItem | undefined | null | void;

/**
 * Tree data provider for the Dev Helper explorer view
 */
export class DevHelperProvider implements vscode.TreeDataProvider<DevToolItem> {
    // Making _onDidChangeTreeData readonly to fix SonarLint warning
    private readonly _onDidChangeTreeData: vscode.EventEmitter<TreeDataEvent> = new vscode.EventEmitter<TreeDataEvent>();
    readonly onDidChangeTreeData: vscode.Event<TreeDataEvent> = this._onDidChangeTreeData.event;

    /**
     * Refresh the tree view
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Get the tree item representation of the element
     */
    getTreeItem(element: DevToolItem): vscode.TreeItem {
        return element;
    }

    /**
     * Get the children of the element
     */
    getChildren(element?: DevToolItem): Thenable<DevToolItem[]> {
        if (element) {
            // Children for the selected element
            if (element.label === 'Geradores') {
                return Promise.resolve([
                    new DevToolItem(
                        'CNPJ',
                        'Gerar número de CNPJ válido',
                        'dev-helper.generateCNPJ',
                        vscode.TreeItemCollapsibleState.None                    ),
                    new DevToolItem(
                        'CPF',
                        'Gerar número de CPF válido',
                        'dev-helper.generateCPF',
                        vscode.TreeItemCollapsibleState.None
                    ),
                    new DevToolItem(
                        'UUID',
                        'Gerar UUID (Identificador Único Universal)',
                        'dev-helper.generateUUID',
                        vscode.TreeItemCollapsibleState.None
                    ),                    new DevToolItem(
                        'PIX QR Code',
                        'Gerar código PIX com QR Code',
                        'dev-helper.generatePix',
                        vscode.TreeItemCollapsibleState.None                    ),
                    new DevToolItem(
                        'Gerador de Hash',
                        'Gerar hashes MD5, SHA1, SHA256',
                        'dev-helper.hashGenerator',
                        vscode.TreeItemCollapsibleState.None
                    ),
                    new DevToolItem(
                        'Gerador de Senhas',
                        'Gerar senhas seguras com opções customizáveis',
                        'dev-helper.passwordGenerator',
                        vscode.TreeItemCollapsibleState.None
                    ),
                    // Add more generators here as needed
                ]);
            } else if (element.label === 'Utilitários') {
                return Promise.resolve([
                    new DevToolItem(
                        'Formatador JSON',
                        'Formatar e validar código JSON',
                        'dev-helper.formatJson',
                        vscode.TreeItemCollapsibleState.None
                    ),                    new DevToolItem(
                        'Codificador Base64',
                        'Codificar/decodificar texto em Base64',
                        'dev-helper.base64Encoder',
                        vscode.TreeItemCollapsibleState.None
                    ),                    new DevToolItem(
                        'Validador de Email',
                        'Validar formato de endereços de email',
                        'dev-helper.emailValidator',
                        vscode.TreeItemCollapsibleState.None                    ),
                    new DevToolItem(
                        'Conversor de Cores',
                        'Converter entre formatos de cores (HEX, RGB, HSL)',
                        'dev-helper.colorConverter',
                        vscode.TreeItemCollapsibleState.None
                    ),
                    new DevToolItem(
                        'Calculadora de Data',
                        'Calcular diferenças entre datas e formatos',
                        'dev-helper.dateCalculator',
                        vscode.TreeItemCollapsibleState.None
                    ),
                    new DevToolItem(
                        'URL Encoder/Decoder',
                        'Codificar e decodificar URLs',
                        'dev-helper.urlEncoder',
                        vscode.TreeItemCollapsibleState.None
                    ),
                    new DevToolItem(
                        'QR Code Reader',
                        'Ler e decodificar códigos QR',
                        'dev-helper.qrReader',
                        vscode.TreeItemCollapsibleState.None
                    ),                    new DevToolItem(
                        'PIX Decoder',
                        'Decodificar códigos PIX QR',
                        'dev-helper.pixDecoder',
                        vscode.TreeItemCollapsibleState.None
                    ),
                    new DevToolItem(
                        'Formatação de texto',
                        'Formatar texto em vários estilos (camelCase, snake_case, etc.)',
                        'dev-helper.textFormatter',
                        vscode.TreeItemCollapsibleState.None
                    ),                    // Add more utilities here as needed
                ]);
            }
            return Promise.resolve([]);
        } else {            // Root level items
            return Promise.resolve([
                new DevToolItem(
                    'Geradores',
                    'Ferramentas para geração de dados',
                    '',
                    vscode.TreeItemCollapsibleState.Expanded
                ),                new DevToolItem(
                    'Utilitários',
                    'Ferramentas utilitárias para desenvolvimento',
                    '',
                    vscode.TreeItemCollapsibleState.Collapsed
                ),
                // Add more categories here as needed
            ]);
        }
    }
}

/**
 * Tree item representing a dev tool
 */
export class DevToolItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly tooltip: string,
        public readonly commandId: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly iconType: string = 'key',
        public readonly showIcon: boolean = false
    ) {
        super(label, collapsibleState);

        this.tooltip = tooltip;

        // Set the command that should be executed when the tree item is selected
        if (commandId) {
            this.command = {
                command: commandId,
                title: label
            };
        }

        // Set the icon based on the type only if showIcon is true
        if (showIcon) {
            this.iconPath = new vscode.ThemeIcon(iconType);
        }
    }

    contextValue = 'devTool';
}
