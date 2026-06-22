# Lógica de Negócio - Página Meu Mata-mata (Playoff)

> Para a tabela completa e oficial do chaveamento (Round of 32 até a
> Final) e a lógica de resolução dos "melhores 3ºs", ver
> **`docs/knockout-rules.md`** — esse é a fonte única de verdade. Este
> documento foca na experiência de simulação da página "Meu Mata-mata".

## Visão Geral

A página **"Meu Mata-mata"** apresenta uma simulação da **primeira fase eliminatória (Round of 32)** da Copa do Mundo FIFA 2026, baseada integralmente nos palpites do usuário para a fase de grupos.

Não se trata de uma previsão do torneio real, mas sim de uma **simulação interativa** que mostra quais seleções se qualificariam e como seria o mata-mata caso os palpites do usuário estivessem corretos.

## Fundamentação nas Regras FIFA 2026

### Estrutura do Torneio

- **Fase de Grupos**: 12 grupos com 4 seleções cada = 48 seleções
- **Qualificados**: 32 seleções avançam para o mata-mata
  - **12 primeiros colocados** dos grupos (1º lugar de cada grupo)
  - **12 segundos colocados** dos grupos (2º lugar de cada grupo)
  - **8 melhores terceiros colocados** entre todos os 12 grupos

### Critério de Qualificação

Cada seleção é classificada em seu grupo conforme o regulamento:

1. **Pontuação** (descrescente)
   - Vitória: 3 pontos
   - Empate: 1 ponto
   - Derrota: 0 pontos

2. **Desempate** (nesta ordem)
   - Saldo de gols (maior é melhor)
   - Gols marcados (maior é melhor)
   - Ordem alfabética (como último critério)

### Identificação dos Terceiros Colocados

Entre os 12 terceiros colocados (um de cada grupo), apenas os **8 melhores** avançam ao mata-mata, ranqueados por pontuação → saldo de gols → gols marcados → fair play → ranking FIFA. Os **4 piores terceiros colocados** são eliminados nesta fase.

> ⚠️ Qual seleção específica enfrenta qual "melhor 3º" **não** segue uma ordem de ranking fixa (não é "o melhor 3º sempre joga o Jogo X"). Depende de **quais 8 dos 12 grupos** geraram um terceiro qualificado, resolvido pela tabela oficial da FIFA (Anexo C — 495 combinações possíveis). Ver `docs/knockout-rules.md` §2 e `src/services/standings/thirdPlaceCombinations.ts`.

## Lógica de Emparelhamento (Chaveamento)

O regulamento oficial da FIFA estabelece um chaveamento **fixo e predeterminado** para os 16 jogos do Round of 32 — e ele **não** é sequencial (não é "1º A x 2º A", nem "1º vs 3º melhor disponível em ordem"). A tabela completa, oficial, com a notação de cada confronto, está documentada em **`docs/knockout-rules.md`** (seção 2) — é a fonte única de verdade para evitar que esta página e o código fiquem dessincronizados novamente.

**Restrição principal**: seleções do mesmo grupo não podem se enfrentar nos 16 avos de final.

## Implementação Técnica

### Fluxo de Dados

```
1. Usuário faz palpites para fase de grupos (tab Palpites)
   ↓
2. Sistema simula os resultados baseado nos palpites
   ↓
3. Calcula as classificações dos grupos
   ↓
4. Extrai 1º, 2º e 3º colocados de cada grupo
   ↓
5. Ordena os 8 melhores terceiros colocados
   ↓
6. Aplica o chaveamento fixo com os 32 classificados
   ↓
7. Exibe os 16 jogos na página "Meu Mata-mata"
```

### Função Principal: `generateRound32(games: Game[])`

**Arquivo**: `src/services/standings/knockoutQualification.ts`

```typescript
export function generateRound32(games: Game[]): KnockoutMatch[] {
  const qualified = calculateQualifiedTeams(games);             // 12 + 12 + 8 = 32 times
  const bestThirds = calculateBestThirdPlace(games).slice(0, 8); // top 8 thirds

  // Resolve which group's 3rd faces which match, per the official
  // Annexe C combination — see docs/knockout-rules.md §2.
  const thirdPlaceOpponents = resolveThirdPlaceOpponents(bestThirds.map((t) => t.group));

  // BRACKET segue exatamente a tabela oficial (article 12.6) —
  // ver docs/knockout-rules.md §2 para a lista completa dos 16 jogos.
  return BRACKET.map(({ home, away }) => ({
    home: resolve(home),
    away: resolve(away),
  }));
}
```

### Hook de Simulação: `useKnockout()`

**Arquivo**: `src/hooks/useKnockout.ts`

```typescript
export function useKnockout(
  games: Game[],
  predictions?: Prediction[],
  currentUserId?: string
) {
  const round32 = useMemo(() => {
    if (predictions && currentUserId) {
      // Simula os jogos usando os palpites do usuário
      const simulatedGames = buildGamesFromPredictions(
        games,
        predictions,
        currentUserId
      );
      return generateRound32(simulatedGames);
    }
    // Caso contrário, usa resultados oficiais (se disponíveis)
    return generateRound32(games);
  }, [games, predictions, currentUserId]);

  return { round32 };
}
```

### Componente de Exibição: `PlayoffSection`

**Arquivo**: `src/components/sections/PlayoffSection.tsx`

- Exibe os 16 jogos em 4 grupos (Chaves A, B, C, D)
- 4 jogos por chave
- Layout responsivo: 2 colunas em desktop, 1 coluna em mobile
- Cada jogo mostra:
  - Número do jogo
  - Seleção da casa (flag + nome + posição no grupo)
  - Separador "VS"
  - Seleção visitante (flag + nome + posição no grupo)

## Fluxo do Usuário

### Passo 1: Fazer Palpites
1. Usuário acessa a aba **"Palpites"**
2. Faz previsões para todos os 48 jogos da fase de grupos
3. Palpites são salvos automaticamente

### Passo 2: Ver Simulação do Mata-mata
1. Usuário acessa a aba **"Meu Mata-mata"**
2. Sistema calcula automaticamente:
   - Classificação de cada grupo (baseada nos palpites)
   - Os 32 classificados
   - Os 8 melhores terceiros
3. Aplica o chaveamento automático
4. Exibe os 16 confrontos

### Passo 3: Interatividade
- Se usuário mudar um palpite na aba "Palpites"
- Volta à aba "Meu Mata-mata"
- O mata-mata é **recalculado automaticamente**
- Reflete o novo cenário baseado nos novos palpites

## Exemplo Prático

### Cenário Simulado

Suponha que o usuário fez os seguintes palpites:

**Grupo A**:
- Brasil 2-1 Tailândia
- Brasil 3-0 Vietnã
- Brasil 1-1 Marrocos
- **Resultado**: Brasil 1º (7 pts), Marrocos 2º (5 pts), Tailândia 3º (3 pts)

**Grupo B**:
- Argentina 3-0 Canadá
- Argentina 2-1 Uruguai
- Argentina 1-0 Malásia
- **Resultado**: Argentina 1º (9 pts), Uruguai 2º (3 pts), Canadá 3º (0 pts)

**... (e assim por diante para os outros 10 grupos)**

### Resultado no Mata-mata

Com base nesses palpites simulados, e seguindo o chaveamento oficial
(`docs/knockout-rules.md` §2):

| Jogo | Casa | Visitante |
|------|------|-----------|
| 1 | Marrocos (2º A) | Uruguai (2º B) |
| 2 | [1º E] | [melhor 3º entre A,B,C,D,F] |
| ... | ... | ... |
| 4 | Brasil (1º C) | [2º F] |

## Dados Calculados

### Equipes Qualificadas

```typescript
interface QualifiedTeam {
  position: "1" | "2" | "3";           // Posição no grupo
  group: string;                       // Letra do grupo (A-L)
  team: string;                        // Nome da seleção
  points: number;                      // Pontos acumulados
  goalDiff: number;                    // Saldo de gols
  goalsFor: number;                    // Gols marcados
  goalsAgainst: number;                // Gols sofridos
}
```

### Confrontos do Mata-mata

```typescript
interface KnockoutMatch {
  home: QualifiedTeam | undefined;     // Time da casa
  away: QualifiedTeam | undefined;     // Time visitante
}
```

## Validações e Regras Implementadas

1. ✅ **Sem duplicatas de grupo**: Verifica que nunca dois times do mesmo grupo se enfrentam
2. ✅ **Resolução oficial dos terceiros**: usa a tabela Anexo C da FIFA (495 combinações) para decidir qual grupo preenche cada vaga de "melhor 3º", não apenas a ordem de ranking
3. ✅ **Chaveamento fixo**: Segue exatamente o padrão oficial (article 12.6, M73-M88) — ver `docs/knockout-rules.md`
4. ✅ **Atualização em tempo real**: Quando palpites mudam, mata-mata é recalculado
5. ✅ **Tratamento de dados incompletos**: Mostra placeholders se nem todos os palpites foram feitos

## Casos de Uso

### Caso 1: Novos Palpites
- Usuário entra na aba "Palpites" e faz todos os palpites
- Navega para "Meu Mata-mata"
- Vê o mata-mata completo com todos os 32 times

### Caso 2: Palpites Parciais
- Usuário faz apenas alguns palpites
- Mata-mata mostra os times que podem ser determinados
- Placeholders aparecem para times cujos grupos ainda não têm palpites suficientes

### Caso 3: Alteração de Palpites
- Usuário muda um palpite na aba "Palpites"
- Mata-mata é recalculado na próxima visualização
- Um time diferente pode se qualificar
- O chaveamento se reorganiza automaticamente

## Performance

- **Cálculo**: Realizado apenas quando necessário (via `useMemo`)
- **Atualização**: Somente quando games ou predictions mudam
- **Renderização**: Componentes otimizados com memo e callbacks
- **Escalabilidade**: O(n) para 48 jogos de grupo, O(1) para chaveamento fixo

## Conclusão

O sistema de "Meu Mata-mata" oferece uma experiência interativa e educacional, permitindo que os usuários:

1. **Façam previsões** detalhadas para toda a fase de grupos
2. **Vejam simulações** realistas do mata-mata
3. **Compreendam** como funcionam os critérios de qualificação e emparelhamento
4. **Explorem cenários** alternativos mudando seus palpites

Tudo isso mantendo total conformidade com as regras oficiais da FIFA World Cup 2026™.
