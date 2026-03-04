# Setup inicial de Auth e Firestore (Firebase Spark)

Essa camada base do monólito conecta as abstrações em Client Components sem forçar `SSR failures`.

## 1. Variáveis Multi-ambiente
Na raiz de desenvolvimento local, defina o arquivo `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAm6JsxS7pshcTuHS0pdqRTGdvn6UMl3Tw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=restaurante360-17ba9.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=restaurante360-17ba9
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=restaurante360-17ba9.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=257997213044
NEXT_PUBLIC_FIREBASE_APP_ID=1:257997213044:web:d016630f806c5737127021
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-VBG2ECG8JH
```

Para engatar isso, o comando inicial DEVE ser refatorado se estava ligado. Reinicie-o:
`Ctrl + C` -> `npm run dev`

## 2. Testando e Validações
O portal interno raiz (`/sistema`) agora disponibiliza na visão principal (Development Mode Only) um card verde chamado **"Desenvolvimento (DEV)"**, que escreve um documento Mock `{ mensagem: "Firebase Conectado" }` em Root `/teste` pra ver se a regra sem binding (Analytics e Client Fetching) bate certo.

## 3. Autenticação 
Seus Usuários não devem logar anonimamente ou socialmente ainda. Eles precisam ser Registrados e autenticados com as chaves customizadas.

1. Vá ao Firebase Auth » Users » **"Add User"**.
2. Digite `<exemplo@email.com>` e a senha.
3. Copie o UID instanciado ali embaixo do email.

## 4. Criando Perfil no Firestore (Estruturas de Role/Identidade)
Os 3 portais agora respondem pela Identidade central na coleção `usuarios`. Vá na Root Coleção em Banco de Dados `usuarios` > `Adicionar Documento`.

Cole como Document ID o mesmo UID que copiou do Auth do passo acima e o popule:

### A) Exemplo Perfil `SISTEMA` (Root Admin do SaaS)
```json
{
  "uid": "1a2b3c4d5e",
  "email": "dono@seu-app.com",
  "nome": "João Super User",
  "papelPortal": "SISTEMA",
  "ativo": true,
  "criadoEm": "2026-03-03T20:00:00.000Z",
  "atualizadoEm": "2026-03-03T20:00:00.000Z"
}
```

### B) Exemplo Perfil `EMPRESA` (Owner de uma Franquia)
```json
{
  "uid": "qwerty1234",
  "email": "gerente@pizzaexpress.com",
  "nome": "Maria Gerente",
  "papelPortal": "EMPRESA",
  "papelEmpresa": "GESTOR",
  "empresaId": "idLocatarioFirestoreExemplo",
  "ativo": true,
  "criadoEm": "2026-03-03T20:00:00.000Z",
  "atualizadoEm": "2026-03-03T20:00:00.000Z"
}
```

### C) Exemplo Perfil `OPERACIONAL` (Funcionário Cozinha)
```json
{
  "uid": "asdfg5678",
  "email": "cozinheiro@pizzaexpress.com",
  "nome": "Carlos Cozinheiro",
  "papelPortal": "OPERACIONAL",
  "papelEmpresa": "OPERACIONAL",
  "empresaId": "idLocatarioFirestoreExemplo",
  "ativo": true,
  "criadoEm": "2026-03-03T20:00:00.000Z",
  "atualizadoEm": "2026-03-03T20:00:00.000Z"
}
```
