# bdsystems-ui

Frontend em React, TypeScript, Vite e SCSS.

## Desenvolvimento

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

Configure `VITE_API_BASE_URL` quando a API não estiver no mesmo host. Sem essa variável, o Vite encaminha `/api` para `http://localhost:8080` durante o desenvolvimento.

## Organização do código

- `src/app/`: rotas, proteção de acesso e layout da área autenticada.
- `src/features/<domínio>/`: páginas, componentes, serviços e tipos específicos. Os domínios atuais são `auth`, `dashboard`, `employees`, `suppliers`, `tools`, `rentals` e `marketing`.
- `src/shared/components/ui/`: elementos de interface sem regras de domínio, como `DataTable<T>`, `Modal`, `RegistrationDialog`, `PageHeader`, `Panel` e `FormField`.
- `src/shared/hooks/`: comportamento reutilizável. `usePaginatedResource<T, F>` controla busca paginada, filtros aplicados, atualização e estados de carregamento/erro.
- `src/shared/api/`: cliente HTTP, mensagens de erro e validação da estrutura de páginas da API. Cada serviço de domínio valida seus próprios registros.
- `src/shared/styles/`: estilos globais e tokens. O SCSS específico fica junto da página ou componente.

Para criar uma funcionalidade, comece pelos tipos e pelo serviço do domínio. Monte a página a partir dos componentes de `shared`, deixando as colunas, os filtros, as mensagens e as ações de negócio na pasta da funcionalidade. Só extraia um novo componente compartilhado depois de identificar um contrato útil em mais de um fluxo. Use generics quando precisarem manter a relação entre os dados e os callbacks, como em `DataTable<T>`.

As rotas atuais de cadastro abrem diálogos sobre as listagens. Fornecedores e ferramentas têm consulta por ID na API e podem ser carregados ao abrir um link direto para edição. A API de funcionários ainda não oferece `GET /api/employees/{id}`; nesse caso, a edição continua dependendo do funcionário estar na página carregada da lista.

Os testes usam Vitest e Testing Library. Cubra o comportamento público de componentes compartilhados e os fluxos que combinam lista, serviço e diálogo. O build invoca TypeScript e Vite com `node` para funcionar com o executável local do TypeScript neste ambiente.
