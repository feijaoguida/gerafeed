# Task 232. Structured Data & Brand Entity

## Contexto

Com crawling, metadata e canonicals prontos, a home precisa representar corretamente a entidade GeraFeed por JSON-LD factual.

## Objetivo

Adicionar structured data reutilizável e validável para:

- Organization;
- WebSite;
- SoftwareApplication.

## Antes de implementar

Inspecione:

- conteúdo público real da home;
- logo/assets oficiais;
- preço/planos efetivamente públicos;
- perfis sociais oficiais já existentes no código;
- depoimentos e números exibidos na landing;
- helpers JSON-LD existentes.

Não confie em textos antigos se divergirem da implementação atual.

## Implementação

### A. Helper seguro

Criar helper/componente pequeno apenas se necessário para serializar JSON-LD com segurança.

Evitar espalhar objetos grandes diretamente em múltiplas páginas.

### B. Organization

Usar somente informações confirmadas no repositório ou fornecidas pelo operador.

Campos típicos:

```text
@type: Organization
name: GeraFeed
url: https://www.gerafeed.com.br
logo: URL pública estável
sameAs: somente perfis oficiais reais
```

Se endereço legal, CNPJ, telefone ou foundingDate não estiverem confirmados, omitir.

### C. WebSite

Representar o site oficial e nome da marca.

Não adicionar SearchAction fictício se não existir busca pública real.

### D. SoftwareApplication

Representar o SaaS de automação/curadoria editorial.

Campos devem ser coerentes com a página visível.

Não inventar:

- operatingSystem específico sem necessidade;
- rating;
- reviews;
- install count;
- users count;
- award;
- price.

Se preço público for estável e visível, pode ser modelado somente após inspeção. Caso contrário, omitir nesta task.

### E. Segurança de dados

Serialização não deve permitir inserir conteúdo arbitrário inseguro de usuário no `<script type="application/ld+json">`.

Structured data desta task é brand-level e deve vir de configuração controlada.

## Fora de escopo

- Article/BlogPosting, que entra com Blog;
- FAQPage automático;
- Review schema;
- Product schema de afiliados;
- alteração de dados do banco.

## Definition of Done

- [ ] Organization JSON-LD presente na home.
- [ ] WebSite JSON-LD presente.
- [ ] SoftwareApplication JSON-LD presente.
- [ ] URLs absolutas usam host canônico.
- [ ] logo existe e é público.
- [ ] `sameAs` contém somente URLs confirmadas ou é omitido.
- [ ] nenhum rating/review/número fictício.
- [ ] structured data corresponde ao conteúdo visível.
- [ ] TypeScript PASS.
- [ ] Lint PASS.
- [ ] Build PASS.

## Validation

Além do build, inspecionar source/HTML da home e validar o JSON parse.

Se houver teste automatizado simples para os objetos/schema, adicionar sem dependência pesada.

A validação final em Rich Results Test/Schema Markup Validator é externa e deve ser registrada como passo manual de Evidence.

## Evidence

Registrar schemas emitidos, campos omitidos por falta de comprovação e validações.
