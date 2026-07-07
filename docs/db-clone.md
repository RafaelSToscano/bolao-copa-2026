# Clonando um banco Supabase para outro

`scripts/db-clone.sh` copia todos os dados de um projeto Supabase
(ORIGIN, tipicamente produção) para outro (DESTINATION, tipicamente
staging). Um comando faz o dump com `supabase db dump` em
`backups/latest/` e restaura no destino.

**Atenção:** é destrutivo no DESTINATION. Faz `DROP SCHEMA public
CASCADE` e `TRUNCATE` nas tabelas em `auth` e `storage` antes de
carregar os dados. Nunca aponte para produção como destino.

## Pré-requisitos

- `supabase` CLI (`brew install supabase/tap/supabase`)
- `psql` (vem com Postgres client tools; `brew install libpq` no macOS
  se ainda não tiver)
- Acesso ao painel de cada projeto Supabase envolvido
- Senha do banco de cada projeto (se você perdeu, dá pra resetar em
  **Project settings → Database → Reset database password**)

## Setup — arquivo `.env.clone`

Duplique o template e preencha as duas URLs:

```bash
cp scripts/.env.clone.example scripts/.env.clone
```

O arquivo `scripts/.env.clone` é ignorado pelo git (a regra `.env*` no
`.gitignore` cobre isso). Só o `.env.clone.example` é versionado.

### Como pegar cada URL no painel Supabase

1. Abra o projeto em <https://supabase.com/dashboard>
2. **Project settings** (ícone de engrenagem) → **Database**
3. Role até **Connection string**
4. **Selecione a aba "Session pooler"** — é a única que funciona aqui
5. Copie a URI e cole no `.env.clone`
6. Troque `[YOUR-PASSWORD]` pela senha do banco

Formato esperado:

```
postgresql://postgres.<project-ref>:SENHA@aws-0-<região>.pooler.supabase.com:5432/postgres
```

### Por que Session pooler e não as outras opções

| Opção no painel | Host | Porta | Serve pro script? |
|---|---|---|---|
| Direct connection | `db.<ref>.supabase.co` | 5432 | ❌ IPv6-only, falha na maioria das redes com `could not translate host name` |
| **Session pooler** | `aws-0-<região>.pooler.supabase.com` | **5432** | ✅ Use esta |
| Transaction pooler | `aws-0-<região>.pooler.supabase.com` | 6543 | ❌ Cancela prepared statements entre chamadas — `pg_dump` quebra no meio |

Marcadores rápidos pra saber se você copiou a certa:

- Usuário tem ponto: `postgres.<project-ref>` (não é só `postgres`)
- Host contém `pooler.supabase.com`
- Porta é `5432`

### Se a senha tiver caractere especial

Se sua senha do banco tem `@`, `#`, `:`, `/`, `?`, `%`, `&` ou espaço,
o parser da URI quebra e o `psql` cai para o usuário `postgres` (sem o
ref), aí você recebe `FATAL: password authentication failed for user
"postgres"`. Duas saídas:

- Percent-encode o caractere (ex.: `@` → `%40`, `#` → `%23`), ou
- **Recomendado:** resete a senha no painel pra algo só alfanumérico
  (**Project settings → Database → Reset database password**)

## Uso

Do diretório raiz do projeto:

```bash
# Dump do ORIGIN + restore no DESTINATION (fluxo padrão)
./scripts/db-clone.sh --confirm

# Só faz o dump em backups/latest/, sem tocar em nada
./scripts/db-clone.sh --confirm --dump-only

# Pula o dump; restaura de um backup existente no DESTINATION
./scripts/db-clone.sh --confirm --source backups/latest
```

`--confirm` é obrigatório em todos os modos como reconhecimento de que
o DESTINATION vai ser sobrescrito.

`--source` é útil quando o dump deu certo mas o restore falhou (ex.:
uma nova tabela gerenciada de storage/auth). Corrija o script, rode
com `--source backups/latest` e itera sem esperar o dump completo.

## O que o script produz

Cada execução sobrescreve `backups/latest/` com:

- `roles.sql` — roles (best-effort, no restore erros em roles
  gerenciados são esperados)
- `schema.sql` — DDL do schema `public`
- `data.sql` — dados de `public` via `COPY`
- `data-managed.sql` — dados de `auth` e `storage` (usuários,
  identities, sessions, buckets, objects) via `COPY`
- `manifest.txt` — timestamp, URL origem mascarada, versão do CLI

`backups/` está no `.gitignore` porque os dumps contêm PII e hashes de
senha. Se quiser preservar um dump específico, copie
`backups/latest/` para outro caminho antes da próxima execução.

## Salvaguardas

- `--confirm` obrigatório
- `--source` e `--dump-only` são mutuamente exclusivos
- Se `ORIGIN_DB_URL == DESTINATION_DB_URL`, o script se recusa a rodar
- Cada URL é testada com um `SELECT current_database()` antes de
  qualquer DDL destrutivo
- `TRUNCATE` em `auth`/`storage` é filtrado por
  `has_table_privilege(current_user, ..., 'TRUNCATE')` — tabelas
  cujos donos são `supabase_auth_admin`/`supabase_storage_admin` são
  puladas em vez de abortar o processo
- Tabelas de extensão (`storage.buckets_vectors`,
  `storage.vector_indexes`, `storage.migrations`) ficam fora do dump
  porque o usuário do pooler não consegue escrever nelas no destino

## Erros comuns

**`psql: error: could not translate host name "db.<ref>.supabase.co"`**
Você usou a Direct connection. Volte no painel e troque pra Session
pooler.

**`FATAL: password authentication failed for user "postgres"`**
Falta o ref no usuário (deve ser `postgres.<ref>`, com ponto), ou a
senha tem caractere especial não escapado. Veja a seção acima.

**`ERROR: permission denied for table <alguma tabela storage/auth>`**
Alguma tabela nova gerenciada pelo Supabase entrou no dump. Adicione
`-x <schema>.<tabela>` na chamada correspondente do
`supabase db dump` dentro de `scripts/db-clone.sh` e rode de novo
(pode usar `--source backups/latest` se o resto do dump está ok).
