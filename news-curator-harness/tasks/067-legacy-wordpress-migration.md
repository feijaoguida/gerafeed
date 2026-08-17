# Task 067. Legacy WordPress Migration

## Objetivo
Migrar a configuração WordPress antiga para `WordPressSite` sem perder dados.

## Estratégia
```text
Configuration.wordpressConnection
→ WordPressSite default
→ migrar credenciais
→ associar feeds existentes
→ validar conexão
→ preservar compatibilidade temporária se necessário
```

## Regras
- não apagar configuração antiga antes de validar;
- migration deve ser idempotente;
- registrar ausência de configuração antiga como caso válido;
- credenciais continuam criptografadas.

## Definition of Done
- [ ] dados migrados.
- [ ] feeds associados.
- [ ] credencial recuperável server-side.
- [ ] migração idempotente.
- [ ] rollback/documentação se necessário.
- [ ] testes.
