# Interface e comportamento responsivo

## Layout global

As páginas autenticadas são renderizadas pelo `AppLayout` em um contêiner centralizado de até 1600 px. O Header usa o mesmo limite, mantendo logo, navegação e conteúdo no mesmo eixo visual. Os paddings continuam responsivos, portanto o conteúdo não encosta nas bordas em telas menores.

Páginas orientadas a dados — Dashboard, Pacientes, Configurações, Grupos e Mensageria — usam toda a largura do contêiner global. Formulários e modais preservam limites menores para evitar campos excessivamente largos.

## Diretório de Acompanhamento

A tabela do Dashboard aparece a partir do breakpoint `lg`; abaixo dele, as mesmas informações são apresentadas em cards.

No desktop, a tabela usa layout fixo e distribui as colunas assim:

| Coluna | Largura |
| --- | ---: |
| Paciente | 28% |
| Agente (ACS) | 15% |
| Condição | 12% |
| Profissional | 12% |
| Tempo | 8% |
| Status | 9% |
| Ação | 16% |

O `whitespace-nowrap` não é aplicado globalmente. Paciente, agente, profissional, tempo, status de confirmação e botão podem quebrar linha; a condição clínica é truncada. Isso impede overflow horizontal no desktop mesmo com nomes ou rótulos extensos.

O status de transporte e a confirmação são apresentados separadamente:

- `Enviado`, `Entregue` e `Visto pelo paciente` descrevem a mensagem;
- `Aguardando confirmação`, `Presença confirmada`, `Cancelamento solicitado` e `Prazo encerrado` descrevem a resposta da consulta.

O botão de disparo fica desabilitado quando há pendência ou resposta terminal, mas essa proteção visual não substitui o bloqueio do backend.

Agendamentos passados sem desfecho usam o badge curto `Vencido`; a coluna Tempo informa `Há X dias`. O rótulo compacto preserva a coluna Status de 9% sem overflow nos breakpoints desktop.

## Diretório de Pacientes

A busca aceita nome, CPF ou CNS e funciona em conjunto com paginação e filtros. A versão desktop usa tabela; a experiência mobile mantém componentes adequados à largura reduzida.

## Critérios de regressão visual

- Header e conteúdo devem permanecer alinhados em 1280, 1440, 1600, 1920 e 2560 px.
- Não deve existir rolagem horizontal na tabela do Dashboard em desktop.
- Textos extensos não podem aumentar a largura da página.
- Cards mobile, formulários e modais não devem herdar a largura ampla das tabelas.
- Estados desabilitados precisam continuar legíveis em uma ou duas linhas.
