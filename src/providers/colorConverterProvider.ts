import * as vscode from 'vscode';
import { loadTemplate } from '../utils/templateLoader';

/**
 * Provider for the Color Converter webview panel
 */
export class ColorConverterProvider {
    /**
     * Track the currently active panels. Only allow a single panel to exist at a time.
     */
    public static currentPanel: ColorConverterProvider | undefined;

    public static readonly viewType = 'colorConverter';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (ColorConverterProvider.currentPanel) {
            ColorConverterProvider.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            ColorConverterProvider.viewType,
            'Conversor de Cores',
            column ?? vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'src', 'templates')
                ]
            }
        );

        ColorConverterProvider.currentPanel = new ColorConverterProvider(panel, extensionUri);
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
                    case 'convertColor':
                        this._convertColor(message.color, message.fromFormat);
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
     * Converts color between different formats
     */
    private _convertColor(color: string, fromFormat: string) {
        try {
            let rgb: { r: number; g: number; b: number };

            // Parse input color based on format
            switch (fromFormat) {
                case 'hex':
                    rgb = this._hexToRgb(color);
                    break;
                case 'rgb':
                    rgb = this._parseRgb(color);
                    break;
                case 'hsl':
                    rgb = this._hslToRgb(color);
                    break;
                default:
                    throw new Error('Formato não suportado');
            }

            // Convert to all formats
            const hex = this._rgbToHex(rgb);
            const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            const hsl = this._rgbToHsl(rgb);
            const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
            const hsv = this._rgbToHsv(rgb);
            const hsvStr = `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`;

            this._panel.webview.postMessage({
                command: 'colorConverted',
                result: {
                    hex: hex,
                    rgb: rgbStr,
                    hsl: hslStr,
                    hsv: hsvStr,
                    rgbValues: rgb,
                    hslValues: hsl,
                    hsvValues: hsv
                },
                success: true
            });
        } catch (error) {
            console.error('Erro ao converter cor:', error);
            this._panel.webview.postMessage({
                command: 'colorConverted',
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                success: false
            });
        }
    }

    /**
     * Converts HEX to RGB
     */
    private _hexToRgb(hex: string): { r: number; g: number; b: number } {
        const cleanHex = hex.replace('#', '');
        if (!/^[0-9A-F]{6}$/i.test(cleanHex)) {
            throw new Error('Formato HEX inválido. Use #RRGGBB');
        }

        const r = parseInt(cleanHex.slice(0, 2), 16);
        const g = parseInt(cleanHex.slice(2, 4), 16);
        const b = parseInt(cleanHex.slice(4, 6), 16);

        return { r, g, b };
    }

    /**
     * Converts RGB to HEX
     */
    private _rgbToHex(rgb: { r: number; g: number; b: number }): string {
        const toHex = (n: number) => {
            const hex = Math.round(n).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
    }

    /**
     * Parses RGB string
     */
    private _parseRgb(rgbStr: string): { r: number; g: number; b: number } {
        const match = rgbStr.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
        if (!match) {
            throw new Error('Formato RGB inválido. Use rgb(r, g, b)');
        }

        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);

        if (r > 255 || g > 255 || b > 255 || r < 0 || g < 0 || b < 0) {
            throw new Error('Valores RGB devem estar entre 0 e 255');
        }

        return { r, g, b };
    }

    /**
     * Converts HSL to RGB
     */
    private _hslToRgb(hslStr: string): { r: number; g: number; b: number } {
        const match = hslStr.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
        if (!match) {
            throw new Error('Formato HSL inválido. Use hsl(h, s%, l%)');
        }

        let h = parseInt(match[1]) / 360;
        const s = parseInt(match[2]) / 100;
        const l = parseInt(match[3]) / 100;

        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) { t += 1; }
            if (t > 1) { t -= 1; }
            if (t < 1 / 6) { return p + (q - p) * 6 * t; }
            if (t < 1 / 2) { return q; }
            if (t < 2 / 3) { return p + (q - p) * (2 / 3 - t) * 6; }
            return p;
        };

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    /**
     * Converts RGB to HSL
     */
    private _rgbToHsl(rgb: { r: number; g: number; b: number }): { h: number; s: number; l: number } {
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
                default: h = 0;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    /**
     * Converts RGB to HSV
     */
    private _rgbToHsv(rgb: { r: number; g: number; b: number }): { h: number; s: number; v: number } {
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, v = max;

        const d = max - min;
        s = max === 0 ? 0 : d / max;

        if (max === min) {
            h = 0;
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
                default: h = 0;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            v: Math.round(v * 100)
        };
    }

    /**
     * Copies text to clipboard
     */
    private async _copyToClipboard(text: string) {
        try {
            await vscode.env.clipboard.writeText(text);
            vscode.window.showInformationMessage('Cor copiada para a área de transferência!');
        } catch (error) {
            console.error('Erro ao copiar cor:', error);
            vscode.window.showErrorMessage('Erro ao copiar cor para a área de transferência.');
        }
    }

    public dispose() {
        ColorConverterProvider.currentPanel = undefined;

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
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return loadTemplate(this._extensionUri, 'color-converter');
    }
}
