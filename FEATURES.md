# Dev Juice - Detalhamento das Funcionalidades

Este documento descreve em detalhes como utilizar cada uma das funcionalidades da extensão Dev Juice.

## Índice

- [Geradores](#geradores)
  - [Gerador de CNPJ](#gerador-de-cnpj)
  - [Gerador de CPF](#gerador-de-cpf)
  - [Gerador de UUID](#gerador-de-uuid)
  - [Gerador de PIX QR Code](#gerador-de-pix-qr-code)
  - [Gerador de Hash](#gerador-de-hash)
  - [Gerador de Senhas](#gerador-de-senhas)
- [Utilitários](#utilitários)
  - [Formatador JSON](#formatador-json)
  - [Codificador Base64](#codificador-base64)
  - [Validador de Email](#validador-de-email)
  - [Formatação de texto](#formatação-de-texto)
  - [Conversor de Cores](#conversor-de-cores)
  - [Calculadora de Data](#calculadora-de-data)
  - [URL Encoder/Decoder](#url-encoderdecoder)
  - [QR Code Reader](#qr-code-reader)
  - [PIX QR Code Decoder](#pix-qr-code-decoder)
- [Conversores](#conversores)
  - [Conversor de Ângulos](#conversor-de-ângulos)
  - [Conversor de Área](#conversor-de-área)
  - [Conversor de Base](#conversor-de-base)
  - [Conversor de Caso](#conversor-de-caso)
  - [Conversor de Moeda](#conversor-de-moeda)
  - [Conversor de Armazenamento](#conversor-de-armazenamento)
  - [Conversor de Volume Seco](#conversor-de-volume-seco)
  - [Conversor de Energia](#conversor-de-energia)
  - [Conversor de Força](#conversor-de-força)
  - [Conversor de Consumo de Combustível](#conversor-de-consumo-de-combustível)
  - [Conversor de Comprimento](#conversor-de-comprimento)

## Geradores

### Gerador de CNPJ

Gera números de CNPJ válidos para uso em desenvolvimento e testes.

**Como usar:**

1. Acesse a funcionalidade através do ícone na Activity Bar
2. Clique em "Gerador de CNPJ" para gerar um novo CNPJ válido
3. Opção para copiar o CNPJ gerado para o clipboard

**Inserção rápida no editor:**

- Comando `Dev Juice: Inserir CNPJ Formatado` - Insere um CNPJ com formato XX.XXX.XXX/XXXX-XX
- Comando `Dev Juice: Inserir CNPJ Não Formatado` - Insere um CNPJ sem formatação (apenas números)

### Gerador de CPF

Gera números de CPF válidos para uso em desenvolvimento e testes.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Gerador de CPF"
3. Clique em "Gerar CPF" para obter um número válido
4. Use os botões para copiar no formato desejado

**Funcionalidades:**

- Interface amigável para geração de CPFs
- Validação automática dos números gerados
- Opções de formatação (com ou sem pontos e traços)

**Inserção rápida no editor:**

- Comando `Dev Juice: Inserir CPF Formatado` - Insere um CPF com formato XXX.XXX.XXX-XX
- Comando `Dev Juice: Inserir CPF Não Formatado` - Insere um CPF sem formatação (apenas números)

### Gerador de UUID

Gera identificadores únicos universais (UUID) para uso em aplicações.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Gerador de UUID"
3. Um novo UUID será gerado automaticamente
4. Use os botões para copiar no formato desejado

**Funcionalidades:**

- Gera UUIDs no formato padrão (v4)
- Opções para UUID formatado (com hífens) ou sem formatação

**Inserção rápida no editor:**

- Comando `Dev Juice: Inserir UUID Formatado` - Insere um UUID com formato XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
- Comando `Dev Juice: Inserir UUID Não Formatado` - Insere um UUID sem hífens

### Gerador de PIX QR Code

Gera códigos PIX completos com QR Code para testes de pagamento.

**Como usar:**

1. Abra o painel do Dev Juice
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

**Funcionalidades:**

- **Chaves PIX suportadas**: CPF, CNPJ, email, telefone (+5511999999999) e chave aleatória (UUID)
- **Validação automática** da chave PIX em tempo real
- **Geração de QR Code** visual para teste
- **Código PIX EMV** completo para integração
- **Campos opcionais**: valor, descrição e ID da transação
- **Download e cópia** do QR Code gerado
- **Interface moderna** e intuitiva

### Gerador de Hash

Gera hashes criptográficos com múltiplos algoritmos.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Gerador de Hash"
3. Insira o texto para gerar os hashes
4. Selecione o algoritmo desejado ou gere todos
5. Copie o resultado com um clique

**Funcionalidades:**

- **Algoritmos suportados**:
  - MD5 (não recomendado para segurança)
  - SHA-1 (obsoleto para segurança)
  - SHA-256 (recomendado)
  - SHA-512 (alta segurança)
- **Geração individual** ou de **todos os hashes** simultaneamente
- **Informações detalhadas** sobre cada algoritmo
- **Interface intuitiva** com explicações sobre segurança

### Gerador de Senhas

Gera senhas seguras com opções totalmente customizáveis.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Gerador de Senhas"
3. Configure as opções desejadas:
   - Comprimento da senha
   - Tipos de caracteres a incluir
4. Clique em "Gerar Senha"
5. Copie a senha gerada com um clique

**Funcionalidades:**

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

## Utilitários

### Formatador JSON

Formata e minifica strings JSON para melhor visualização e depuração.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Formatador JSON"
3. Cole seu JSON no campo de entrada
4. Escolha entre formatar (pretty) ou minificar
5. Copie o resultado formatado

**Funcionalidades:**

- Formatação com indentação configurável
- Minificação para reduzir tamanho
- Validação automática de sintaxe
- Tratamento de erros com mensagens claras
- Cópia rápida do resultado

### Codificador Base64

Codifica e decodifica textos e arquivos usando Base64.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Codificador Base64"
3. Escolha a operação (codificar ou decodificar)
4. Insira o texto ou selecione o arquivo
5. O resultado é gerado automaticamente

**Funcionalidades:**

- Codificação de texto para Base64
- Decodificação de Base64 para texto
- Suporte a arquivos (imagens, documentos, etc.)
- Visualização de imagens codificadas
- Detecção automática de codificação

### Validador de Email

Valida endereços de email com análise detalhada.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Validador de Email"
3. Insira o email a ser validado
4. Visualize o resultado da validação e detalhes

**Funcionalidades:**

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

### Formatação de texto

Converte texto entre diferentes formatos de caso e estilo.

**Como usar via painel:**

1. Acesse o painel do Dev Juice
2. Selecione "Formatação de texto"
3. Insira o texto a ser formatado
4. Escolha o formato desejado
5. Copie o resultado ou insira no editor

**Como usar via comandos:**

1. Selecione o texto no editor
2. Abra a paleta de comandos (Ctrl+Shift+P ou Cmd+Shift+P)
3. Digite "Dev Juice: Formatar" para ver as opções
4. Escolha o formato desejado

**Formatos suportados:**

- **Sentence case**: Primeira letra maiúscula, resto minúsculo
- **snake_case**: Palavras separadas por underscore
- **camelCase**: Primeira palavra minúscula, demais com inicial maiúscula
- **kebab-case**: Palavras separadas por hífen
- **PascalCase**: Todas as palavras com inicial maiúscula
- **lower case**: Tudo em minúsculas
- **UPPER CASE**: Tudo em maiúsculas
- **Capitalized Case**: Cada Palavra Com Inicial Maiúscula
- **aLtErNaTiNg cAsE**: Alternância entre maiúscula e minúscula
- **InVeRsE CaSe**: Inverte o caso de cada caractere

### Conversor de Cores

Converte cores entre diferentes formatos.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Conversor de Cores"
3. Insira a cor em qualquer formato suportado
4. Visualize a conversão para todos os outros formatos
5. Copie o valor desejado com um clique

**Funcionalidades:**

- **Formatos suportados**: HEX, RGB, HSL, HSV
- **Conversão bidirecional** entre todos os formatos
- **Interface visual** com preview da cor
- **Cópia rápida** para área de transferência
- **Validação** de formatos de entrada

### Calculadora de Data

Ferramenta completa para cálculos com datas.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Calculadora de Data"
3. Escolha a operação desejada:
   - Diferença entre datas
   - Adicionar/subtrair tempo de uma data
4. Preencha os campos necessários
5. Visualize o resultado detalhado

**Funcionalidades:**

- **Diferença entre datas**: Calcule diferenças em anos, meses, dias, horas, etc.
- **Adicionar/Subtrair tempo**: Adicione ou subtraia períodos de uma data
- **Múltiplos formatos**: Suporte a vários formatos de data
- **Data atual automaticamente carregada**
- **Resultados detalhados** com explicações

### URL Encoder/Decoder

Codifica e decodifica URLs de forma segura.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "URL Encoder/Decoder"
3. Escolha a operação (codificar ou decodificar)
4. Insira a URL ou texto
5. O resultado é gerado automaticamente

**Funcionalidades:**

- **Codificação automática** de caracteres especiais
- **Decodificação** de URLs codificadas
- **Processamento em tempo real** com debounce
- **Suporte completo** a caracteres UTF-8
- **Exemplos práticos** para facilitar o uso

### QR Code Reader

Lê e decodifica códigos QR de imagens.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "QR Code Reader"
3. Faça upload de uma imagem contendo um QR code
   - Arraste e solte ou use o botão de upload
4. O conteúdo do QR code será decodificado automaticamente
5. Copie o resultado com um clique

**Funcionalidades:**

- **Múltiplos formatos de imagem**: PNG, JPG, JPEG, GIF, BMP, WEBP
- **Drag & Drop** para upload fácil
- **Preview da imagem** carregada
- **Detecção automática** de QR Codes
- **Biblioteca jsQR** para alta precisão

### PIX QR Code Decoder

Decodifica códigos PIX QR para análise e verificação.

**Como usar:**

1. Abra o painel do Dev Juice
2. Navegue até "PIX Decoder"
3. Escolha o método:
   - **Aba "Código PIX"**: Cole a string completa do código PIX
   - **Aba "Imagem QR"**: Faça upload de uma foto do QR Code
4. Visualize todas as informações decodificadas organizadamente

**Funcionalidades:**

- **Decodificação de string PIX**: Cole o código PIX completo para análise
- **Leitura de imagem QR**: Upload de fotos/screenshots de QR Codes PIX
- **Informações detalhadas**:
  - Dados do beneficiário (nome, cidade, chave PIX)
  - Informações da transação (valor, moeda, categoria)
  - Dados adicionais (identificador, referências)
  - Validação de integridade (CRC16)
- **Detecção automática** do tipo de chave PIX
- **Interface em abas** para diferentes métodos de entrada
- **Exportação** das informações decodificadas

## Conversores

### Conversor de Ângulos

Converte valores entre diferentes unidades de ângulo.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Conversor de Ângulos"
3. Insira o valor na unidade de origem
4. Visualize a conversão para todas as outras unidades

**Unidades suportadas:**

- Graus (°)
- Radianos (rad)
- Grados (grad)
- Minutos de arco (′)
- Segundos de arco (″)
- Ciclos/Rotações

### Conversor de Área

Converte valores entre diferentes unidades de área.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Conversor de Área"
3. Insira o valor na unidade de origem
4. Visualize a conversão para todas as outras unidades

**Unidades suportadas:**

- Metro quadrado (m²)
- Quilômetro quadrado (km²)
- Centímetro quadrado (cm²)
- Milímetro quadrado (mm²)
- Hectare (ha)
- Acre
- Pé quadrado (ft²)
- Polegada quadrada (in²)
- Milha quadrada (mi²)
- Jarda quadrada (yd²)

### Conversor de Base

Converte números entre diferentes sistemas numéricos.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Conversor de Base"
3. Insira o número na base de origem
4. Selecione a base de origem
5. Visualize a conversão para todas as outras bases

**Bases suportadas:**

- Decimal (Base 10)
- Binário (Base 2)
- Octal (Base 8)
- Hexadecimal (Base 16)
- Personalizada (2-36)

### Conversor de Caso

Converte texto entre diferentes formatos de caso.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Conversor de Caso"
3. Insira o texto a ser convertido
4. Visualize a conversão para todos os formatos de caso

**Formatos suportados:**

- camelCase
- PascalCase
- snake_case
- kebab-case
- UPPER_SNAKE_CASE
- Sentence case
- Title Case
- lower case
- UPPER CASE

### Conversor de Moeda

Converte valores entre diferentes moedas.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Conversor de Moeda"
3. Insira o valor na moeda de origem
4. Selecione a moeda de origem e destino
5. Visualize o valor convertido

**Funcionalidades:**

- Taxas de câmbio atualizadas
- Suporte para mais de 30 moedas
- Histórico de conversões
- Valores arredondados com precisão

### Conversor de Armazenamento

Converte valores entre diferentes unidades de armazenamento digital.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Conversor de Armazenamento"
3. Insira o valor na unidade de origem
4. Visualize a conversão para todas as outras unidades

**Unidades suportadas:**

- Bit (b)
- Byte (B)
- Kilobyte (KB)
- Megabyte (MB)
- Gigabyte (GB)
- Terabyte (TB)
- Petabyte (PB)
- Kibibyte (KiB)
- Mebibyte (MiB)
- Gibibyte (GiB)
- Tebibyte (TiB)
- Pebibyte (PiB)

### Conversor de Volume Seco

Converte valores entre diferentes unidades de volume seco.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Conversor de Volume Seco"
3. Insira o valor na unidade de origem
4. Visualize a conversão para todas as outras unidades

**Unidades suportadas:**

- Litro (L)
- Mililitro (mL)
- Galão US (gal)
- Quarto US (qt)
- Pinta US (pt)
- Onça fluida US (fl oz)
- Xícara
- Colher de sopa
- Colher de chá
- Bushel

### Conversor de Energia

Converte valores entre diferentes unidades de energia.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Conversor de Energia"
3. Insira o valor na unidade de origem
4. Visualize a conversão para todas as outras unidades

**Unidades suportadas:**

- Joule (J)
- Kilojoule (kJ)
- Caloria (cal)
- Kilocaloria (kcal)
- Watt-hora (Wh)
- Kilowatt-hora (kWh)
- Elétron-volt (eV)
- BTU (British Thermal Unit)
- Pé-libra (ft⋅lb)
- Erg

### Conversor de Força

Converte valores entre diferentes unidades de força.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Conversor de Força"
3. Insira o valor na unidade de origem
4. Visualize a conversão para todas as outras unidades

**Unidades suportadas:**

- Newton (N)
- Kilonewton (kN)
- Dina (dyn)
- Libra-força (lbf)
- Poundal
- Kgf (Quilograma-força)
- Tonelada-força (tf)

### Conversor de Consumo de Combustível

Converte valores entre diferentes unidades de consumo de combustível.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Conversor de Consumo de Combustível"
3. Insira o valor na unidade de origem
4. Visualize a conversão para todas as outras unidades

**Unidades suportadas:**

- Quilômetros por litro (km/L)
- Litros por 100 km (L/100km)
- Milhas por galão US (MPG)
- Milhas por galão UK (MPG UK)
- Galões US por 100 milhas (gal/100mi)
- Galões UK por 100 milhas (gal UK/100mi)

### Conversor de Comprimento

Converte valores entre diferentes unidades de comprimento.

**Como usar:**

1. Acesse o painel do Dev Juice
2. Selecione "Conversor de Comprimento"
3. Insira o valor na unidade de origem
4. Visualize a conversão para todas as outras unidades

**Unidades suportadas:**

- Metro (m)
- Quilômetro (km)
- Centímetro (cm)
- Milímetro (mm)
- Micrômetro (μm)
- Nanômetro (nm)
- Milha (mi)
- Jarda (yd)
- Pé (ft)
- Polegada (in)
- Milha náutica (nmi)
