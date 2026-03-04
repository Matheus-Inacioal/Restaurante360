# Autenticação, Login e Depuração (SaaS Admin)

Este guia concentra as informações necessárias para operar, simular e depurar o fluxo de Login Firebase em qualquer ambiente (desenvolvimento / produção).

---

## 1. Configuração do Firebase Authentication
Para que o portal aceite os logins que nosso sistema cria:
1. Acesse o **Firebase Console**.
2. Vá em `Build` > `Authentication` > `Sign-in method`.
3. Habilite a opção **Email/Password**.
4. Em `Settings` > `Authorized domains`, garanta que `localhost` esteja mapeado para fins de desenvolvimento local, junto com os domínios do SaaS em prod (ex: `app.restaurante360.com.br`).

---

## 2. A Estrutura de Auth (Como a checagem funciona)
Nosso sistema separa Identidade (Auth) de Regras de Negócio (Firestore).
Mesmo que alguém crie uma conta no seu Firebase Auth por fora, eles estarão efetivamente "presos" na tela de erro `/perfil-nao-provisionado`, pois a aplicação só libera acesso a dashboars (`/sistema`, `/empresa`, `/operacional`) quando **lê e verifica permissões na coleção `usuarios/{uid}` do Firestore**.

### O que o Guard Portal Verifica:
- O Doc deve existir.
- Propriedade `ativo` deve ser `true`.
- Se a rota for `/sistema`, o campo `papelPortal` deve ser estritamente `"SISTEMA"`.
- Se a rota for `EMPRESA` ou `OPERACIONAL`, deve-se bater as Roles correspondentes E confirmar se possuem o campo `empresaId`.

---

## 3. Bootstrap Automático de Superadmin (SISTEMA) em DEV
Para facilitar a criação de Operadores Masters (`papelPortal: "SISTEMA"`) sem precisar interagir visualmente com o Firebase Console, expusemos uma Rota de Dev-Only que emula tudo.

> **Importante:** Este endpoint só funciona se o comando no terminal estiver rodando como desenvolvimento (`NODE_ENV === "development"`). Um bloqueio no backend desativará isso em Prod.

### Como rodar o Bootstrap
Abra o seu terminal e cole o seguinte Request via cURL para processar a injeção do Admin na base (Substitua os valores de e-mail nome e senha à sua criatividade). O endpoint fará upsert, se a conta já existir ele a transforma num Superadmin.

```bash
curl -X POST http://localhost:9002/api/dev/bootstrap-superadmin \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Super Gestor 360",
    "email": "master@restaurante360.com.br",
    "senha": "SenhaForte123*"
  }'
```

Uma resposta de sucesso será similar a:
```json
{
  "ok": true,
  "uid": "wJ200eH1r8gTyJ09M7k...",
  "email": "master@restaurante360.com.br",
  "mensagem": "Superadmin (SISTEMA) provisionado com sucesso. Faça login."
}
```

Vá até a UI de nossa aplicação em `http://localhost:9002/login` e coloque suas novas credenciais para ser arremessado ao `/sistema` de imediato.
