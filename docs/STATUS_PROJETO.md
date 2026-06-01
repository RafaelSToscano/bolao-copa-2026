# Bolão Copa 2026 - Status Atual

## Funcionalidades concluídas

* Login por celular + senha
* Aprovação de usuários
* Ranking
* Classificação por grupo
* Mata-mata
* Palpites aleatórios
* Botão limpar palpites
* Responsividade mobile
* Bandeiras atualizadas
* URL produção:
  https://bolao-copa-2026-fifa.vercel.app

## Funcionalidades em desenvolvimento

### Palpites Finais

Tabela criada:

final_predictions

Campos:

* champion
* runner_up
* third_place

Componente:

* FinalPredictionsCard.tsx

Pendente:

* Ajustar RLS do Supabase
* Testar persistência após refresh
* Melhorar layout visual
* Criar pontuação futura

## Próximas melhorias

1. Pontuação campeão/vice/terceiro
2. Regulamento dentro do app
3. Auditoria dos palpites finais
4. Relatório admin dos palpites finais
5. Melhorias visuais da classificação desktop

## Último teste realizado

Erro:
permission denied for table final_predictions

Necessário revisar policies da tabela.