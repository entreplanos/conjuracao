# Conjuração — Guia de Deploy (tudo pelo navegador)

## 1. Supabase — criar o schema

1. Abra o projeto do Supabase que você já usa pra Convocação/Sessão Zero (ou crie um novo, se quiser isolar).
2. Menu lateral → **SQL Editor** → **New query**.
3. Cole o conteúdo do arquivo `supabase-schema.sql` inteiro e clique em **Run**.
4. Confira em **Table Editor** se a tabela `kv` está lá (você já deve ter ela de outra ferramenta — o script não recria nem apaga nada, só garante que existe e adiciona as políticas da Conjuração).
5. Confira em **Storage** se o bucket `conjuracao-catalogo` apareceu marcado como público.

Se a tabela `kv` já existir (que é o seu caso, reaproveitando o projeto da Convocação), tudo bem — o script usa `create table if not exists` e não vai duplicar nada. As políticas específicas da Conjuração (`conjuracao_*`) são isoladas por nome e não mexem nas políticas que já existem pra Convocação/Sessão Zero.

## 2. Supabase — criar seu usuário de admin

1. Menu lateral → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Preencha um e-mail e senha (essas são as credenciais que você vai usar pra entrar no painel admin da Conjuração).
3. Marque **Auto Confirm User** (senão o Supabase vai exigir confirmação por e-mail antes do primeiro login).
4. Clique em **Create user**.

## 3. Pegar as chaves do Supabase

1. Menu lateral → **Project Settings** (ícone de engrenagem) → **API**.
2. Copie **Project URL** e a chave **anon public**. Vai precisar delas no passo 5.

## 4. Subir o código pro GitHub

1. Crie um repositório novo no GitHub (ex: `conjuracao`).
2. Dentro dele, **Add file → Upload files**.
3. Arraste todos os arquivos deste pacote (mantendo tudo solto na raiz, sem pasta — é o mesmo padrão flat que você já usa nas outras ferramentas).
4. Commit direto na branch `main`.

## 5. Deploy no Vercel

1. **Add New → Project** → importe o repositório `conjuracao`.
2. Antes de clicar em Deploy, abra **Environment Variables** e adicione:
   - `VITE_SUPABASE_URL` → a Project URL que você copiou
   - `VITE_SUPABASE_ANON_KEY` → a anon key que você copiou
3. Clique em **Deploy**.
4. Depois do primeiro deploy, se esquecer de configurar as variáveis antes: adicione em **Settings → Environment Variables** e depois force um **Redeploy** (elas só entram em vigor num novo build).

## 6. Testar

- Abra a URL do Vercel → deve aparecer o selo mágico da Conjuração.
- Clique no selo → vai pro catálogo (vazio no começo, isso é esperado).
- Clique no ícone de chave no canto superior direito → tela de login → entre com o e-mail/senha que você criou no passo 2.
- Cadastre alguns itens de teste no admin, volte ao catálogo (`#catalogo` na URL) e confira se eles aparecem.

## O que ainda fica pendente (próximas ondas)

- **Vínculo automático com a Convocação**: hoje o mestre digita a data manualmente na Conjuração. Pra puxar a data automaticamente a partir do código da mesa, precisamos olhar o schema real da Convocação no Supabase e escrever a consulta certa — isso é uma tarefa separada.
- **Programa de fidelidade**: o campo de prioridade discutido não está implementado ainda; hoje o critério de conflito é só ordem de chegada (`createdAt`).
- **Painel de reservas por data**: uma visão agregada pra você, mostrando tudo que está reservado num dia específico, ainda não foi construída.
