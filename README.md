# Sistema de Almoxarifado - Enfermagem

Aplicativo mobile desenvolvido em React Native com Expo para controle inicial de estoque de materiais de enfermagem.

O sistema permite visualizar o inventario atual em uma lista com rolagem, buscar materiais pelo nome e cadastrar novos insumos na MockAPI.

## Funcionalidades

- Listagem dinamica de materiais usando `FlatList`.
- Busca de materiais por nome.
- Cadastro de novo material com nome e quantidade.
- Requisicao `GET` para carregar o estoque ao abrir o app.
- Requisicao `POST` para enviar novos materiais para a MockAPI.
- Totalizador de itens e unidades em estoque.
- Funcao de validacao para retirada de estoque.

## Uso basico

1. Abra o aplicativo pelo Expo Go.
2. Aguarde o carregamento do estoque vindo da MockAPI.
3. Digite o nome do material no campo de busca para filtrar a lista.
4. Informe nome e quantidade para cadastrar um novo insumo.
5. Confira o material novo aparecendo no topo da lista.

## Tecnologias

- React Native
- Expo
- JavaScript
- MockAPI
- Jest
- Testing Library React Native

## MockAPI

Endpoint usado no projeto:

```text
https://6a2b396cb687a7d5cbc4fa03.mockapi.io/materiais
```

Campos enviados no cadastro:

```json
{
  "nome": "Seringa 10ml",
  "quantidade": 50,
  "categoria": "Consumo"
}
```

## Como rodar

Instale as dependencias:

```bash
npm install
```

Inicie o Expo:

```bash
npm start
```

Para abrir no celular, use o aplicativo Expo Go e leia o QR Code exibido no terminal.

Se o QR Code normal nao abrir na rede local, rode em modo tunel:

```bash
npx expo start --tunnel
```

## Testes

Execute os testes automatizados:

```bash
npm test
```

## Estrutura principal

- `App.js`: tela principal com formulario, busca, totalizadores, GET e POST.
- `src/utils/validacoes.js`: funcao `validarRetirada` usada para validar baixas de estoque.
- `__tests__/`: testes automatizados das sprints.

## Contrato tecnico

Componentes obrigatorios implementados:

- `TextInput` do nome: `testID="input-nome"`
- `TextInput` da quantidade: `testID="input-quantidade"` com `keyboardType="numeric"`
- Botao de cadastro: `testID="btn-cadastrar"`
- Lista de materiais: `testID="lista-materiais"`

## Criterios atendidos

- Interface mobile com campos obrigatorios e lista rolavel.
- `useEffect` carregando o estoque com `GET` ao abrir o aplicativo.
- Cadastro de material enviando JSON com `POST` para a MockAPI.
- Documentacao com tecnologias, endpoint e instrucoes de execucao.
