# Papiro Full - Gestão Inteligente de Estudos

Aplicação moderna em **React + TypeScript + Vite + Tailwind CSS** para gestão de estudos para concursos públicos, organização de ciclo semanal de 7 dias, edital verticalizado, acompanhamento de prazos de revisão e cronômetro integrado.

## Funcionalidades Principais

- **Autenticação**: Integração com Supabase Auth (Login e Cadastro com isolamento total por usuário) e modo Convidado para testes rápidos.
- **Ciclo de Estudos de 7 Dias**: Programação diária dinâmica com ancoragem em data base, visualização em carrossel dos 7 dias e configuração de matérias por dia.
- **Edital Verticalizado e Revisão por Blocos**:
  - Organização por matérias em acordeões retráteis.
  - Indicadores de status automáticos: Em dia (🟢), Atenção (🟡) e Atrasado (🔴).
  - Cálculo de dias desde a última revisão.
  - Botão de revisão rápida ("✓ Revisar").
  - Links diretos para plataformas de questões (TEC Concursos e Qconcursos).
  - Configuração de prazos e exclusão de tópicos.
  - Modelo pronto para o edital do TRT-3.
- **Cronômetro e Registro de Sessões**:
  - Modo Livre (contagem progressiva).
  - Modo Regressivo (com presets de 30m, 50m, 60m e 90m).
  - Modo Manual para inserção retroativa de tempo estudado.
- **Relatório Completo de Estatísticas**:
  - Métricas de tempo estudado hoje, nos últimos 15 dias, no mês e acumulado total.
  - Gráfico semanal com o tempo exato estudado por dia (Segunda a Domingo).
  - Filtro por período personalizado com soma total.
- **Tema Claro e Escuro**: Alternância instantânea com persistência no LocalStorage.
- **Perfil do Concurseiro**: Customização de nome, concurso/projeto e upload de foto de avatar.

## Execução

```bash
npm run dev
```

Dev server roda na porta 3000 em `0.0.0.0:3000`.
