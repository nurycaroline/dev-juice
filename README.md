# Dev Helper

Esta extensão do VS Code fornece ferramentas úteis para desenvolvedores brasileiros.

## Funcionalidades

### Gerador de CNPJ

Gera números de CNPJ válidos para uso em desenvolvimento e testes.

- Acesse a funcionalidade através do ícone na Activity Bar
- Clique em "Gerador de CNPJ" para gerar um novo CNPJ válido
- Opção para copiar o CNPJ gerado para o clipboard

### Gerador de CPF

Gera números de CPF válidos para uso em desenvolvimento e testes.

- Interface amigável para geração de CPFs
- Validação automática dos números gerados
- Opções de formatação

### Gerador de UUID

Gera identificadores únicos universais (UUID) para uso em aplicações.

- Gera UUIDs no formato padrão
- Opções para UUID formatado ou sem formatação

### 🆕 Gerador de PIX QR Code

Gera códigos PIX completos com QR Code para testes de pagamento.

- **Chaves PIX suportadas**: CPF, CNPJ, email, telefone (+5511999999999) e chave aleatória (UUID)
- **Validação automática** da chave PIX em tempo real
- **Geração de QR Code** visual para teste
- **Código PIX EMV** completo para integração
- **Campos opcionais**: valor, descrição e ID da transação
- **Download e cópia** do QR Code gerado
- **Interface moderna** e intuitiva

#### Como usar o Gerador de PIX

1. Abra o painel do Dev Helper
2. Clique em "PIX QR Code"
3. Preencha os campos obrigatórios:
   - **Chave PIX**: Sua chave PIX (CPF, CNPJ, email, etc.)
   - **Nome do Recebedor**: Nome completo ou razão social
   - **Cidade**: Cidade do recebedor
4. Campos opcionais:
   - **Valor**: Valor da transação em reais
   - **Descrição**: Descrição da transação
   - **ID da Transação**: Identificador único
5. Clique em "Gerar PIX QR Code"
6. O QR Code e código PIX serão gerados automaticamente

## Como usar

1. Abra o painel do Dev Helper clicando no ícone de ferramentas na Activity Bar
2. Selecione a ferramenta desejada na lista
3. Para geradores com interface gráfica, uma nova aba será aberta com o formulário
4. Para inserção rápida no código, use os comandos de inserção disponíveis na paleta de comandos (Ctrl+Shift+P)

## Comandos Disponíveis

A extensão oferece comandos para inserção rápida de valores gerados diretamente no editor:

- `Dev Helper: Inserir CNPJ Formatado`
- `Dev Helper: Inserir CNPJ Não Formatado`
- `Dev Helper: Inserir CPF Formatado`
- `Dev Helper: Inserir CPF Não Formatado`
- `Dev Helper: Inserir UUID Formatado`
- `Dev Helper: Inserir UUID Não Formatado`

### 🔧 Tools

Ferramentas especializadas para desenvolvedores:

### Validador de Email 📧

Valida endereços de email com análise detalhada:

- **Validação RFC 5322** compliant
- **Verificações detalhadas**:
  - Formato básico e avançado
  - Validação da parte local (antes do @)
  - Validação do domínio (depois do @)
  - Detecção de erros comuns
- **Sugestões inteligentes** para correção de erros de digitação
- **Identificação de provedores** populares (Gmail, Yahoo, Outlook, etc.)
- **Validação em lote** para múltiplos emails
- **Relatório estatístico** com resumo dos resultados
- **Validação em tempo real** durante a digitação

### Gerador de Hash 🔐

Gera hashes criptográficos com múltiplos algoritmos:

- **Algoritmos suportados**:
  - MD5 (não recomendado para segurança)
  - SHA-1 (obsoleto para segurança)
  - SHA-256 (recomendado)
  - SHA-512 (alta segurança)
- **Geração individual** ou de **todos os hashes** simultaneamente
- **Informações detalhadas** sobre cada algoritmo
- **Interface intuitiva** com explicações sobre segurança

### Gerador de Senhas 🔐

Gera senhas seguras com opções totalmente customizáveis:

- **Comprimento configurável**: De 4 a 128 caracteres
- **Tipos de caracteres**:
  - Letras minúsculas (a-z)
  - Letras maiúsculas (A-Z)
  - Números (0-9)
  - Símbolos especiais (!@#$%^&*)
  - Caracteres personalizados
- **Indicador de força** da senha gerada
- **Geração criptograficamente segura** usando Node.js crypto
- **Interface intuitiva** com controles visuais

### Conversor de Cores 🎨

Converte cores entre diferentes formatos:

- **Formatos suportados**: HEX, RGB, HSL, HSV
- **Conversão bidirecional** entre todos os formatos
- **Interface visual** com preview da cor
- **Cópia rápida** para área de transferência
- **Validação** de formatos de entrada

### Calculadora de Data 📅

Ferramenta completa para cálculos com datas:

- **Diferença entre datas**: Calcule diferenças em anos, meses, dias, horas, etc.
- **Adicionar/Subtrair tempo**: Adicione ou subtraia períodos de uma data
- **Múltiplos formatos**: Suporte a vários formatos de data
- **Data atual automaticamente carregada**
- **Resultados detalhados** com explicações

### URL Encoder/Decoder 🔗

Codifica e decodifica URLs de forma segura:

- **Codificação automática** de caracteres especiais
- **Decodificação** de URLs codificadas
- **Processamento em tempo real** com debounce
- **Suporte completo** a caracteres UTF-8
- **Exemplos práticos** para facilitar o uso

### QR Code Reader 📱

Lê e decodifica códigos QR de imagens:

- **Múltiplos formatos de imagem**: PNG, JPG, JPEG, GIF, BMP, WEBP
- **Drag & Drop** para upload fácil
- **Preview da imagem** carregada
- **Detecção automática** de QR Codes
- **Biblioteca jsQR** para alta precisão

## Requisitos

Não há requisitos especiais para esta extensão.

## Configurações

Esta extensão não adiciona configurações adicionais.

## Release Notes

### 1.0.0

**Funcionalidades Principais Implementadas:**

#### Geradores

- ✅ **Gerador de CNPJ**: Números válidos com formatação opcional
- ✅ **Gerador de CPF**: Números válidos com formatação opcional  
- ✅ **Gerador de UUID**: Identificadores únicos universais (v4)
- ✅ **Gerador de PIX**: Códigos QR para pagamentos brasileiros
- ✅ **Gerador de Hash**: MD5, SHA-1, SHA-256, SHA-512
- ✅ **Gerador de Senhas**: Senhas seguras customizáveis

#### Utilitários

- ✅ **Formatador JSON**: Formatação e minificação de JSON
- ✅ **Codificador Base64**: Codificação e decodificação
- ✅ **Validador de Email**: Validação individual e em lote

#### Tools

- ✅ **Conversor de Cores**: HEX, RGB, HSL, HSV
- ✅ **Calculadora de Data**: Diferenças e cálculos temporais
- ✅ **URL Encoder/Decoder**: Codificação segura de URLs
- ✅ **QR Code Reader**: Leitura de códigos QR de imagens

**Melhorias:**

- Interface moderna e responsiva
- Painel principal organizado em seções
- Comandos para inserção direta no editor
- Suporte completo a copy/paste
- Validações abrangentes
- Documentação completa

### 0.0.1

- Funcionalidade inicial de geração de CNPJ válido
- Interface na Activity Bar

**Aproveite!**
