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
                        vscode.TreeItemCollapsibleState.None
                    ),
                    // Add more generators here as needed
                ]);
            }
            return Promise.resolve([]);
        } else {
            // Root level items
            return Promise.resolve([
                new DevToolItem(
                    'Geradores',
                    'Ferramentas para geração de dados',
                    '',
                    vscode.TreeItemCollapsibleState.Expanded
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
