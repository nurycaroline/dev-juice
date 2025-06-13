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

#### Gerador de Senhas 🔐

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

#### Em Desenvolvimento

- **Conversor de Cores**: Converter entre HEX, RGB, HSL
- **Calculadora de Data**: Calcular diferenças entre datas
- **URL Encoder/Decoder**: Codificar e decodificar URLs
- **QR Code Reader**: Ler e decodificar códigos QR

## Requisitos

Não há requisitos especiais para esta extensão.

## Configurações

Esta extensão não adiciona configurações adicionais.

## Release Notes

### 0.0.1

- Funcionalidade inicial de geração de CNPJ válido
- Interface na Activity Bar

**Aproveite!**
