# Roblox Performance Agent

Versão: **1.0**

Agente local em **Node.js** para Windows 10/11 que monitora o computador enquanto o Roblox estiver aberto e aplica otimizações seguras do sistema operacional.

## Objetivo

Melhorar a estabilidade do sistema enquanto o Roblox estiver em execução, monitorando:

- CPU;
- RAM;
- disco;
- GPU quando disponível;
- temperatura quando disponível;
- processos pesados;
- plano de energia;
- estabilidade da rede.

## Segurança

Este agente **não faz**:

- modificação de arquivos do Roblox;
- alteração de memória do jogo;
- engenharia reversa;
- automação dentro do jogo;
- burlar sistemas antitrapaça;
- fornecer vantagem competitiva.

O agente atua apenas no sistema operacional do usuário.

## Como executar

Instale o Node.js.

Depois, dentro da pasta do projeto:

```bash
npm start