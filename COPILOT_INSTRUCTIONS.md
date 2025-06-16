# Diretrizes para Desenvolvimento de Extensões VS Code

Este documento descreve as melhores práticas e padrões para o desenvolvimento de extensões para o Visual Studio Code. Siga estas diretrizes para garantir consistência, performance e manutenibilidade em toda a extensão.

## Estrutura do Projeto

- Mantenha a estrutura do projeto organizada e consistente:
  - `/src`: Arquivos fonte TypeScript
  - `/src/providers`: Provedores de painéis WebView e outras classes de provedores
  - `/src/utils`: Funções utilitárias e classes auxiliares
  - `/src/templates`: Templates HTML para WebViews
  - `/resources`: Recursos estáticos como imagens e ícones

## Convenções de Nomenclatura

- Use padrões de nomenclatura consistentes:
  - Arquivos: `camelCase.ts` para arquivos utilitários, `camelCaseProvider.ts` para classes de provedores
  - Classes: `PascalCase` (ex., `JsonFormatterProvider`)
  - Métodos e propriedades: `camelCase`
  - Constantes: `UPPER_SNAKE_CASE` para constantes verdadeiras
  - Comandos: formato `prefixo.acao` (ex., `dev-helper.formatJson`)
  - Mantenha a nomenclatura do provedor consistente (ex., sempre use `AlgumaCoisa`Provider para provedores de WebView)

## Organização do Código

- Organize as importações em ordem alfabética
- Mantenha uma ordem consistente no arquivo extension.ts:
  1. Importações
  2. Definições de tipos
  3. Constantes e importações com carregamento lazy
  4. Função de ativação da extensão
  5. Registros de comandos (em ordem alfabética)
  6. Inscrições de eventos
  7. Função de desativação da extensão
- Organize os comandos em ordem alfabética ao registrá-los
- Agrupe funcionalidades relacionadas

## Implementação de WebView

- Use um padrão consistente para implementações de WebView:
  - Implemente um padrão singleton para provedores de painéis
  - Use o padrão de template para conteúdo HTML
  - Gerencie mensagens de forma consistente entre a extensão e o WebView
- Faça cache de templates para melhor performance
- Gerencie instâncias de WebView centralmente para evitar vazamentos de memória
- Mantenha políticas de segurança consistentes

## Considerações de Performance

- Use carregamento lazy para provedores para melhorar o tempo de inicialização
- Implemente cache onde apropriado (ex., cache de templates)
- Descarte recursos adequadamente quando não forem mais necessários
- Limite o número de painéis ativos para conservar memória

## Tratamento de Erros

- Implemente tratamento de erros adequado para todas as operações
- Forneça mensagens de erro significativas para os usuários
- Registre erros adequadamente para depuração

## Acessibilidade

- Garanta que todos os elementos da UI sejam acessíveis
- Forneça atalhos de teclado para ações comuns
- Siga as diretrizes de acessibilidade do VS Code

## Testes

- Escreva testes para todas as funcionalidades e utilitários
- Teste casos extremos e cenários de erro
- Garanta compatibilidade com diferentes versões do VS Code

## Documentação

- Documente todas as APIs públicas, classes e métodos
- Forneça descrições claras de parâmetros e valores de retorno
- Documente IDs de comandos e seus propósitos
- Mantenha a documentação atualizada com as mudanças no código

## Registro de Comandos

- Registre todos os comandos durante a ativação da extensão
- Limpe todos os registros durante a desativação
- Organize os registros de comandos em ordem alfabética para facilitar a manutenção

## Gerenciamento de Recursos

- Descarte os descartáveis adequadamente para evitar vazamentos de memória
- Use as inscrições do contexto da extensão para rastrear descartáveis
- Implemente limpeza adequada na desativação

## Melhores Práticas

- Siga as Diretrizes Oficiais de Extensões do VS Code
- Mantenha as dependências mínimas e atualizadas
- Use o modo estrito do TypeScript e evite tipos `any` quando possível
- Mantenha um estilo de codificação consistente em todo o projeto
- Use nomes descritivos para variáveis e funções
- Mantenha funções pequenas e focadas em uma única responsabilidade

## Idioma do Código

- Escreva todo o código, comentários, nomes de variáveis e funções em inglês
- Mantenha mensagens para o usuário em português (quando a extensão for voltada para usuários brasileiros)
- Documente APIs em inglês para manter consistência com o ecossistema VS Code
- Mantenha nomes de comandos e IDs em inglês
- Use termos técnicos em inglês para manter compatibilidade com documentação oficial
