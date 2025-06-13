import * as vscode from 'vscode';
import { insertText } from '../utils/insertUtils';

export class PixDecoderProvider {
    // Making currentPanel readonly to fix SonarLint warning
    private static currentPanel: vscode.WebviewPanel | undefined;

    public static createOrShow(extensionUri: vscode.Uri): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (PixDecoderProvider.currentPanel) {
            PixDecoderProvider.currentPanel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            'pixDecoder',
            'PIX QR Code Decoder',
            column ?? vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: []
            }
        );

        PixDecoderProvider.currentPanel = panel;

        // Set the webview's initial html content
        panel.webview.html = PixDecoderProvider.getWebviewContent();

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'decodePixString':
                        PixDecoderProvider.handleDecodePixString(message.pixCode);
                        break;
                    case 'decodeQrImage':
                        PixDecoderProvider.handleDecodeQrImage(message.imageData);
                        break;
                    case 'insertInEditor':
                        insertText(message.text);
                        break;
                    case 'copyToClipboard':
                        vscode.env.clipboard.writeText(message.text);
                        vscode.window.showInformationMessage('Dados do PIX copiados para a área de transferência!');
                        break;
                }
            },
            undefined
        );

        // Listen for when the panel is disposed
        panel.onDidDispose(
            () => {
                PixDecoderProvider.currentPanel = undefined;
            },
            null
        );
    }

    private static handleDecodePixString(pixCode: string): void {
        const panel = PixDecoderProvider.currentPanel;
        if (!panel) {
            return;
        }

        try {
            const decodedData = PixDecoderProvider.decodePixPayload(pixCode);
            panel.webview.postMessage({ 
                command: 'pixDecodeResult', 
                result: decodedData,
                success: true
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            panel.webview.postMessage({ 
                command: 'pixDecodeResult', 
                result: { error: errorMessage },
                success: false
            });
        }
    }

    private static handleDecodeQrImage(imageData: string): void {
        const panel = PixDecoderProvider.currentPanel;
        if (!panel) {
            return;
        }

        // Send message to webview to process the QR code using jsQR
        panel.webview.postMessage({ 
            command: 'processPixQrCode', 
            imageData: imageData 
        });
    }

    private static decodePixPayload(payload: string): any {
        // Remove whitespace and validate basic format
        const cleanPayload = payload.trim();
        
        if (!cleanPayload) {
            throw new Error('Código PIX vazio');
        }        // Check if it's a valid PIX payload (should start with specific patterns)
        const pixRegex = /^00020\d/;
        if (!pixRegex.exec(cleanPayload)) {
            throw new Error('Formato de código PIX inválido');
        }

        const result: any = {
            version: '',
            initMethod: '',
            merchantInfo: {},
            transactionInfo: {},
            additionalInfo: {},
            crc: ''
        };

        let index = 0;
          try {
            while (index < cleanPayload.length - 4) { // -4 for CRC at the end
                const id = cleanPayload.substring(index, index + 2);
                const length = parseInt(cleanPayload.substring(index + 2, index + 4), 10);
                const value = cleanPayload.substring(index + 4, index + 4 + length);
                
                switch (id) {
                    case '00': // Payload Format Indicator
                        result.version = value;
                        break;
                    case '01': // Point of Initiation Method
                        result.initMethod = value;
                        break;
                    case '26': // Merchant Account Information (PIX)
                        result.merchantInfo = PixDecoderProvider.parsePixMerchantInfo(value);
                        break;
                    case '52': // Merchant Category Code
                        result.transactionInfo.categoryCode = value;
                        break;
                    case '53': // Transaction Currency
                        result.transactionInfo.currency = value;
                        result.transactionInfo.currencyName = value === '986' ? 'BRL (Real Brasileiro)' : value;
                        break;
                    case '54': // Transaction Amount
                        result.transactionInfo.amount = parseFloat(value);
                        break;
                    case '58': // Country Code
                        result.transactionInfo.countryCode = value;
                        break;
                    case '59': // Merchant Name
                        result.merchantInfo.name = value;
                        break;
                    case '60': // Merchant City
                        result.merchantInfo.city = value;
                        break;
                    case '62': // Additional Data Field Template
                        result.additionalInfo = PixDecoderProvider.parseAdditionalInfo(value);
                        break;
                    case '63': // CRC16
                        result.crc = value;
                        break;
                    default:
                        // Store unknown fields
                        result.unknownFields ??= {};
                        result.unknownFields[id] = value;
                        break;
                }
                
                index += 4 + length;
            }

            // Validate CRC
            const payloadWithoutCrc = cleanPayload.substring(0, cleanPayload.length - 4);
            const calculatedCrc = PixDecoderProvider.calculateCRC16(payloadWithoutCrc);
            result.crcValid = result.crc.toUpperCase() === calculatedCrc.toUpperCase();

            return result;
        } catch (error) {
            throw new Error(`Erro ao decodificar PIX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }    private static parsePixMerchantInfo(value: string): any {
        const info: any = {};
        let index = 0;

        while (index < value.length) {
            const id = value.substring(index, index + 2);
            const length = parseInt(value.substring(index + 2, index + 4), 10);
            const fieldValue = value.substring(index + 4, index + 4 + length);

            switch (id) {
                case '00': // GUI
                    info.gui = fieldValue;
                    break;
                case '01': // PIX Key
                    info.pixKey = fieldValue;
                    info.keyType = PixDecoderProvider.detectPixKeyType(fieldValue);
                    break;
                case '02': // Additional Info
                    info.additionalInfo = fieldValue;
                    break;
                default:
                    info.unknownFields ??= {};
                    info.unknownFields[id] = fieldValue;
                    break;
            }

            index += 4 + length;
        }

        return info;
    }    private static parseAdditionalInfo(value: string): any {
        const info: any = {};
        let index = 0;

        while (index < value.length) {
            const id = value.substring(index, index + 2);
            const length = parseInt(value.substring(index + 2, index + 4), 10);
            const fieldValue = value.substring(index + 4, index + 4 + length);

            switch (id) {
                case '05': // Reference Label
                    info.referenceLabel = fieldValue;
                    break;
                case '50': // Payment System Specific Template
                    info.paymentSystemTemplate = fieldValue;
                    break;
                default:
                    info.unknownFields ??= {};
                    info.unknownFields[id] = fieldValue;
                    break;
            }

            index += 4 + length;
        }

        return info;
    }

    private static detectPixKeyType(pixKey: string): string {
        // CPF/CNPJ pattern
        if (/^\d{11}$/.test(pixKey)) {
            return 'CPF';
        }
        if (/^\d{14}$/.test(pixKey)) {
            return 'CNPJ';
        }
        
        // Email pattern
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)) {
            return 'E-mail';
        }
        
        // Phone pattern
        if (/^\+55\d{10,11}$/.test(pixKey)) {
            return 'Telefone';
        }
        
        // UUID pattern (EVP)
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pixKey)) {
            return 'Chave Aleatória (EVP)';
        }

        return 'Tipo desconhecido';
    }

    private static calculateCRC16(data: string): string {
        const polynomial = 0x1021;
        let crc = 0xFFFF;

        for (let i = 0; i < data.length; i++) {
            crc ^= (data.charCodeAt(i) << 8);
            
            for (let j = 0; j < 8; j++) {
                if (crc & 0x8000) {
                    crc = (crc << 1) ^ polynomial;
                } else {
                    crc <<= 1;
                }
                crc &= 0xFFFF;
            }
        }

        return crc.toString(16).toUpperCase().padStart(4, '0');
    }

    private static getWebviewContent(): string {
        return `<!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>PIX QR Code Decoder</title>
            <script src="https://unpkg.com/jsqr@1.4.0/dist/jsQR.js"></script>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                    padding: 20px;
                    max-width: 1000px;
                    margin: 0 auto;
                    line-height: 1.6;
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                }

                .container {
                    background-color: var(--vscode-editor-background);
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    color: var(--vscode-foreground);
                    margin-bottom: 20px;
                    text-align: center;
                }

                .section {
                    margin-bottom: 30px;
                    padding: 20px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                    background-color: var(--vscode-input-background);
                }

                .section h2 {
                    margin-top: 0;
                    color: var(--vscode-foreground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 10px;
                }

                .tabs {
                    display: flex;
                    margin-bottom: 20px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .tab {
                    padding: 10px 20px;
                    cursor: pointer;
                    border: none;
                    background: transparent;
                    color: var(--vscode-foreground);
                    border-bottom: 2px solid transparent;
                    transition: all 0.3s ease;
                }

                .tab.active {
                    border-bottom-color: var(--vscode-focusBorder);
                    color: var(--vscode-focusBorder);
                }

                .tab:hover {
                    background-color: var(--vscode-list-hoverBackground);
                }

                .tab-content {
                    display: none;
                }

                .tab-content.active {
                    display: block;
                }

                textarea {
                    width: 100%;
                    min-height: 120px;
                    padding: 10px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    resize: vertical;
                    box-sizing: border-box;
                }

                textarea:focus {
                    outline: none;
                    border-color: var(--vscode-focusBorder);
                }

                .upload-area {
                    border: 2px dashed var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 40px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background-color: var(--vscode-input-background);
                }

                .upload-area:hover {
                    border-color: var(--vscode-focusBorder);
                    background-color: var(--vscode-list-hoverBackground);
                }

                .upload-area.dragover {
                    border-color: var(--vscode-focusBorder);
                    background-color: var(--vscode-list-hoverBackground);
                }

                .upload-icon {
                    font-size: 48px;
                    margin-bottom: 10px;
                }

                input[type="file"] {
                    display: none;
                }

                button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    margin: 5px;
                }

                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }

                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .secondary-btn {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }

                .secondary-btn:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }

                .result-area {
                    margin-top: 20px;
                    padding: 15px;
                    background-color: var(--vscode-textCodeBlock-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                    display: none;
                }

                .result-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin: 15px 0;
                }

                .result-card {
                    background-color: var(--vscode-input-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 6px;
                    padding: 15px;
                }

                .result-card h3 {
                    margin-top: 0;
                    margin-bottom: 10px;
                    color: var(--vscode-foreground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 5px;
                }

                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 8px 0;
                    padding: 5px 0;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }

                .info-label {
                    font-weight: 500;
                    color: var(--vscode-foreground);
                }

                .info-value {
                    font-family: 'Courier New', monospace;
                    color: var(--vscode-foreground);
                    word-break: break-all;
                }

                .status-indicator {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                }

                .status-valid {
                    background-color: var(--vscode-charts-green);
                    color: white;
                }

                .status-invalid {
                    background-color: var(--vscode-charts-red);
                    color: white;
                }

                .image-preview {
                    max-width: 100%;
                    max-height: 300px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                    margin: 10px 0;
                }

                .info {
                    background-color: var(--vscode-editorInfo-background);
                    border-left: 4px solid var(--vscode-editorInfo-foreground);
                    padding: 10px;
                    margin: 15px 0;
                    border-radius: 0 4px 4px 0;
                }

                .error {
                    background-color: var(--vscode-editorError-background);
                    border-left: 4px solid var(--vscode-editorError-foreground);
                    padding: 10px;
                    margin: 15px 0;
                    border-radius: 0 4px 4px 0;
                }

                .success {
                    background-color: var(--vscode-editorInfo-background);
                    border-left: 4px solid var(--vscode-charts-green);
                    padding: 10px;
                    margin: 15px 0;
                    border-radius: 0 4px 4px 0;
                }

                .loading {
                    text-align: center;
                    padding: 20px;
                    color: var(--vscode-foreground);
                }

                .spinner {
                    border: 2px solid var(--vscode-panel-border);
                    border-top: 2px solid var(--vscode-focusBorder);
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    animation: spin 1s linear infinite;
                    display: inline-block;
                    margin-right: 10px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .button-group {
                    margin-top: 15px;
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                @media (max-width: 600px) {
                    body {
                        padding: 10px;
                    }
                    
                    .container {
                        padding: 15px;
                    }
                    
                    .upload-area {
                        padding: 20px;
                    }
                    
                    .button-group {
                        flex-direction: column;
                    }
                    
                    button {
                        width: 100%;
                    }
                    
                    .result-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>💰 PIX QR Code Decoder</h1>
                
                <div class="section">
                    <h2>📥 Decodificar PIX</h2>
                    
                    <div class="tabs">
                        <button class="tab active" onclick="switchTab('string')">📝 Código PIX</button>
                        <button class="tab" onclick="switchTab('image')">📷 Imagem QR</button>
                    </div>

                    <div id="stringTab" class="tab-content active">
                        <label for="pixInput">Cole o código PIX aqui:</label>
                        <textarea id="pixInput" placeholder="Cole o código PIX completo aqui (ex: 00020101021226...)"></textarea>
                        
                        <div class="button-group">
                            <button onclick="decodePixString()">Decodificar PIX</button>
                            <button class="secondary-btn" onclick="clearPixInput()">Limpar</button>
                        </div>
                        
                        <div class="info">
                            <strong>ℹ️ Como usar:</strong> Cole o código PIX completo (string) que você recebeu. O decodificador irá extrair todas as informações como chave PIX, valor, beneficiário, etc.
                        </div>
                    </div>

                    <div id="imageTab" class="tab-content">
                        <div class="upload-area" onclick="document.getElementById('fileInput').click()" 
                             ondragover="handleDragOver(event)" ondrop="handleDrop(event)">
                            <div class="upload-icon">📱</div>
                            <p><strong>Clique aqui ou arraste uma imagem de QR Code PIX</strong></p>
                            <p>Formatos suportados: PNG, JPG, JPEG, GIF, BMP, WEBP</p>
                        </div>
                        
                        <input type="file" id="fileInput" accept="image/*" onchange="handleFileSelect(event)">
                        
                        <div class="info">
                            <strong>ℹ️ Como usar:</strong> Faça upload de uma foto ou screenshot do QR Code PIX. O sistema irá ler o código e decodificar automaticamente as informações do pagamento.
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>📊 Resultado da Decodificação</h2>
                    
                    <div id="loadingArea" class="loading" style="display: none;">
                        <div class="spinner"></div>
                        Processando código PIX...
                    </div>
                    
                    <div id="resultArea" class="result-area">
                        <div id="imagePreview"></div>
                        <div id="resultStatus"></div>
                        <div id="resultData"></div>
                        <div class="button-group">
                            <button class="secondary-btn" onclick="copyResult()">Copiar Informações</button>
                            <button class="secondary-btn" onclick="insertResult()">Inserir no Editor</button>
                            <button onclick="clearResult()">Limpar</button>
                        </div>
                    </div>
                </div>

                <div class="info">
                    <strong>💡 Sobre o PIX:</strong> O PIX é o sistema de pagamentos instantâneos brasileiro. Este decodificador extrai informações como chave PIX, valor da transação, dados do beneficiário e validação de integridade (CRC16).
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                let currentResult = '';
                let activeTab = 'string';

                function switchTab(tab) {
                    // Update active tab
                    activeTab = tab;
                    
                    // Hide all tab contents
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    
                    // Remove active class from all tabs
                    document.querySelectorAll('.tab').forEach(tabElement => {
                        tabElement.classList.remove('active');
                    });
                    
                    // Show selected tab content
                    if (tab === 'string') {
                        document.getElementById('stringTab').classList.add('active');
                        document.querySelector('.tab:nth-child(1)').classList.add('active');
                    } else {
                        document.getElementById('imageTab').classList.add('active');
                        document.querySelector('.tab:nth-child(2)').classList.add('active');
                    }
                }

                function decodePixString() {
                    const input = document.getElementById('pixInput').value.trim();
                    if (!input) {
                        showError('Por favor, cole um código PIX válido.');
                        return;
                    }
                    
                    showLoading();
                    vscode.postMessage({
                        command: 'decodePixString',
                        pixCode: input
                    });
                }

                function clearPixInput() {
                    document.getElementById('pixInput').value = '';
                    clearResult();
                }

                function handleFileSelect(event) {
                    const file = event.target.files[0];
                    if (file) {
                        processFile(file);
                    }
                }

                function handleDragOver(event) {
                    event.preventDefault();
                    event.currentTarget.classList.add('dragover');
                }

                function handleDrop(event) {
                    event.preventDefault();
                    event.currentTarget.classList.remove('dragover');
                    
                    const files = event.dataTransfer.files;
                    if (files.length > 0) {
                        processFile(files[0]);
                    }
                }

                function processFile(file) {
                    if (!file.type.startsWith('image/')) {
                        showError('Por favor, selecione um arquivo de imagem válido.');
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const img = new Image();
                        img.onload = function() {
                            showLoading();
                            decodeQRCode(img, e.target.result);
                        };
                        img.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }

                function decodeQRCode(img, imageSrc) {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = img.width;
                        canvas.height = img.height;
                        
                        ctx.drawImage(img, 0, 0);
                        
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        
                        hideLoading();
                        
                        if (code) {
                            // Show image preview
                            document.getElementById('imagePreview').innerHTML = 
                                '<img src="' + imageSrc + '" class="image-preview" alt="QR Code PIX Image">';
                            
                            // Decode the PIX code
                            vscode.postMessage({
                                command: 'decodePixString',
                                pixCode: code.data
                            });
                        } else {
                            showError('Nenhum QR Code encontrado na imagem. Verifique se a imagem contém um QR Code PIX válido e se está bem visível.');
                        }
                    } catch (error) {
                        hideLoading();
                        showError('Erro ao processar a imagem: ' + error.message);
                    }
                }

                function showLoading() {
                    document.getElementById('loadingArea').style.display = 'block';
                    document.getElementById('resultArea').style.display = 'none';
                }

                function hideLoading() {
                    document.getElementById('loadingArea').style.display = 'none';
                }

                function showResult(data, success) {
                    const resultArea = document.getElementById('resultArea');
                    const resultStatus = document.getElementById('resultStatus');
                    const resultData = document.getElementById('resultData');
                    
                    if (success && data) {
                        currentResult = JSON.stringify(data, null, 2);
                        resultStatus.innerHTML = '<div class="success"><strong>✅ PIX decodificado com sucesso!</strong></div>';
                        resultData.innerHTML = formatPixData(data);
                    } else {
                        currentResult = '';
                        const errorMsg = data && data.error ? data.error : 'Erro ao decodificar PIX';
                        resultStatus.innerHTML = '<div class="error"><strong>❌ ' + errorMsg + '</strong></div>';
                        resultData.innerHTML = '';
                    }
                    
                    resultArea.style.display = 'block';
                }

                function formatPixData(data) {
                    let html = '<div class="result-grid">';
                    
                    // Basic Info Card
                    html += '<div class="result-card">';
                    html += '<h3>📋 Informações Básicas</h3>';
                    if (data.version) {
                        html += '<div class="info-row"><span class="info-label">Versão:</span><span class="info-value">' + data.version + '</span></div>';
                    }
                    if (data.initMethod) {
                        html += '<div class="info-row"><span class="info-label">Método Iniciação:</span><span class="info-value">' + data.initMethod + '</span></div>';
                    }
                    if (data.crc) {
                        const crcStatus = data.crcValid ? 'Válido' : 'Inválido';
                        const crcClass = data.crcValid ? 'status-valid' : 'status-invalid';
                        html += '<div class="info-row"><span class="info-label">CRC16:</span><span class="info-value">' + data.crc + ' <span class="status-indicator ' + crcClass + '">' + crcStatus + '</span></span></div>';
                    }
                    html += '</div>';
                    
                    // Merchant Info Card
                    if (data.merchantInfo && Object.keys(data.merchantInfo).length > 0) {
                        html += '<div class="result-card">';
                        html += '<h3>🏪 Informações do Beneficiário</h3>';
                        if (data.merchantInfo.name) {
                            html += '<div class="info-row"><span class="info-label">Nome:</span><span class="info-value">' + data.merchantInfo.name + '</span></div>';
                        }
                        if (data.merchantInfo.city) {
                            html += '<div class="info-row"><span class="info-label">Cidade:</span><span class="info-value">' + data.merchantInfo.city + '</span></div>';
                        }
                        if (data.merchantInfo.pixKey) {
                            html += '<div class="info-row"><span class="info-label">Chave PIX:</span><span class="info-value">' + data.merchantInfo.pixKey + '</span></div>';
                        }
                        if (data.merchantInfo.keyType) {
                            html += '<div class="info-row"><span class="info-label">Tipo da Chave:</span><span class="info-value">' + data.merchantInfo.keyType + '</span></div>';
                        }
                        if (data.merchantInfo.gui) {
                            html += '<div class="info-row"><span class="info-label">GUI:</span><span class="info-value">' + data.merchantInfo.gui + '</span></div>';
                        }
                        html += '</div>';
                    }
                    
                    // Transaction Info Card
                    if (data.transactionInfo && Object.keys(data.transactionInfo).length > 0) {
                        html += '<div class="result-card">';
                        html += '<h3>💰 Informações da Transação</h3>';
                        if (data.transactionInfo.amount !== undefined) {
                            html += '<div class="info-row"><span class="info-label">Valor:</span><span class="info-value">R$ ' + data.transactionInfo.amount.toFixed(2) + '</span></div>';
                        }
                        if (data.transactionInfo.currencyName) {
                            html += '<div class="info-row"><span class="info-label">Moeda:</span><span class="info-value">' + data.transactionInfo.currencyName + '</span></div>';
                        }
                        if (data.transactionInfo.categoryCode) {
                            html += '<div class="info-row"><span class="info-label">Categoria:</span><span class="info-value">' + data.transactionInfo.categoryCode + '</span></div>';
                        }
                        if (data.transactionInfo.countryCode) {
                            html += '<div class="info-row"><span class="info-label">País:</span><span class="info-value">' + data.transactionInfo.countryCode + '</span></div>';
                        }
                        html += '</div>';
                    }
                    
                    // Additional Info Card
                    if (data.additionalInfo && Object.keys(data.additionalInfo).length > 0) {
                        html += '<div class="result-card">';
                        html += '<h3>ℹ️ Informações Adicionais</h3>';
                        if (data.additionalInfo.referenceLabel) {
                            html += '<div class="info-row"><span class="info-label">Identificador:</span><span class="info-value">' + data.additionalInfo.referenceLabel + '</span></div>';
                        }
                        if (data.additionalInfo.paymentSystemTemplate) {
                            html += '<div class="info-row"><span class="info-label">Template Sistema:</span><span class="info-value">' + data.additionalInfo.paymentSystemTemplate + '</span></div>';
                        }
                        html += '</div>';
                    }
                    
                    html += '</div>';
                    return html;
                }

                function showError(message) {
                    const resultArea = document.getElementById('resultArea');
                    const imagePreview = document.getElementById('imagePreview');
                    const resultStatus = document.getElementById('resultStatus');
                    const resultData = document.getElementById('resultData');
                    
                    imagePreview.innerHTML = '';
                    resultStatus.innerHTML = '<div class="error"><strong>❌ Erro:</strong> ' + message + '</div>';
                    resultData.innerHTML = '';
                    resultArea.style.display = 'block';
                    currentResult = '';
                }

                function copyResult() {
                    if (currentResult) {
                        vscode.postMessage({
                            command: 'copyToClipboard',
                            text: currentResult
                        });
                    }
                }

                function insertResult() {
                    if (currentResult) {
                        vscode.postMessage({
                            command: 'insertInEditor',
                            text: currentResult
                        });
                    }
                }

                function clearResult() {
                    document.getElementById('resultArea').style.display = 'none';
                    document.getElementById('fileInput').value = '';
                    document.getElementById('imagePreview').innerHTML = '';
                    currentResult = '';
                }

                // Listen for messages from the extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'pixDecodeResult':
                            hideLoading();
                            showResult(message.result, message.success);
                            break;
                    }
                });

                // Remove dragover class when dragging leaves the area
                document.addEventListener('dragleave', function(e) {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                        document.querySelector('.upload-area').classList.remove('dragover');
                    }
                });
            </script>
        </body>
        </html>`;
    }
}
