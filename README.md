# Instituto VibraSer 3.0

Plataforma digital integrada do Instituto VibraSer. Projeto independente das aplicações e repositórios anteriores.

**Lema:** Conhecer. Integrar. Transformar.

## Estado atual

Fundação inicial da aplicação React + TypeScript + Vite, interface responsiva de apresentação e preparação da configuração Supabase. A autenticação, a área de aluno, a gestão, os pagamentos e as reservas ainda não estão implementados.

## Tecnologias

- React e TypeScript
- Vite
- Supabase JavaScript client
- CSS responsivo
- Português de Portugal

## Requisitos

- Node.js compatível com a versão de Vite instalada
- npm
- Projeto Supabase dedicado ao Instituto VibraSer 3.0

## Desenvolvimento local

1. Instala o Node.js LTS.
2. Clona este repositório.
3. Instala as dependências:

   ```bash
   npm install
   ```

4. Copia `.env.example` para `.env.local` e preenche apenas o Project URL e a publishable key do projeto Supabase.
5. Inicia o servidor:

   ```bash
   npm run dev
   ```

6. Verifica a compilação:

   ```bash
   npm run build
   ```

## Variáveis de ambiente

- `VITE_SUPABASE_URL`: URL do projeto Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: chave publicável do Supabase.

Não coloques palavras-passe, chaves `service_role` ou chaves `sb_secret_*` no frontend ou no repositório. O ficheiro `.env.local` está excluído pelo `.gitignore`.

## Próximas fases

1. Confirmar compilação e funcionamento local.
2. Definir migrações SQL versionadas, modelo de dados e políticas RLS.
3. Implementar autenticação e perfis com permissões.
4. Construir a Escola Online e o percurso inicial de Reiki.
5. Implementar área do aluno e administração.
6. Integrar compras, pagamentos, reservas e eventos.
7. Executar testes funcionais e de segurança antes da publicação.

## Limitação atual

A interface inicial não representa funcionalidades de compra, autenticação ou reserva concluídas. Os respetivos fluxos serão implementados e testados nas fases seguintes.
