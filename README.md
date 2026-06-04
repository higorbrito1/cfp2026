# Escala de Guarda

Site para calcular a escala automática de guarda do quartel com rotação entre os grupos A, B, C, D, E e F.

## O que faz

- Calcula o grupo de qualquer data.
- Mostra uma escala simples de 7 dias.
- Exibe um calendário mensal com a rotação.
- Permite alterar a data base e o grupo inicial.

## Como rodar

```powershell
npm install
npm run dev
```

Depois abra `http://localhost:3000`.

## Publicar no GitHub Pages

Este projeto já vem configurado para GitHub Pages com export estático.

1. Crie um repositório no GitHub com o mesmo nome ou atualize o `repoName` em [`next.config.mjs`](next.config.mjs).
2. Envie o código para a branch `main`.
3. Ative GitHub Pages usando a opção `GitHub Actions`.
4. O workflow em [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) faz o deploy automático a cada push.

## Exemplo

Se a base for `08/06/2026` com o grupo `D`, o sistema calcula:

- `08/06` = `D`
- `09/06` = `E`
- `10/06` = `F`
- `11/06` = `A`
- `12/06` = `B`
- `13/06` = `C`
- `14/06` = `D`
