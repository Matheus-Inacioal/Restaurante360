# Regras de Segurança Multi-Tenant Restaurante360

O Restaurante360 utiliza 3 tipos base de papéis com as regras restritas abaixo limitando Coleções multi-tenant entre perfis do portal Gestor Lojista (Administradores/Operacionais de uma Tenant), e Gestor Geral (Root Admin, ex. dono do SaaS).

Cole o seguinte código exato no Firebase Console » Firestore Database » aba Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function estaLogado() {
      return request.auth != null;
    }

    function uid() {
      return request.auth.uid;
    }

    function perfil() {
      return get(/databases/$(database)/documents/usuarios/$(uid())).data;
    }

    function temPerfil() {
      return exists(/databases/$(database)/documents/usuarios/$(uid()));
    }

    function portalSistema() {
      return temPerfil() && perfil().papelPortal == "SISTEMA" && perfil().ativo == true;
    }

    function portalEmpresaOuOperacional() {
      return temPerfil()
        && (perfil().papelPortal == "EMPRESA" || perfil().papelPortal == "OPERACIONAL")
        && perfil().ativo == true
        && perfil().empresaId is string
        && perfil().empresaId.size() > 0;
    }

    function pertenceAoTenant(empresaId) {
      return portalEmpresaOuOperacional() && perfil().empresaId == empresaId;
    }

    match /usuarios/{userId} {
      allow read: if estaLogado() && userId == uid();
      allow create: if estaLogado() && userId == uid();
      allow update: if estaLogado() && userId == uid();
      allow delete: if portalSistema();
    }

    match /empresas/{empresaId} {
      allow read: if portalSistema() || pertenceAoTenant(empresaId);
      allow create, update, delete: if portalSistema();

      match /{colecao}/{docId} {
        allow read, write: if portalSistema() || pertenceAoTenant(empresaId);
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
