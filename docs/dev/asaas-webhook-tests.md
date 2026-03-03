# Simulando Eventos de Webhook do ASAAS Localmente

Este documento contém curls pré-configurados para simular eventos que a provedora de pagamento efetuará contra as rotas internas via Webhook. A idempotência testará instâncias repetidas dos IDs de evento.

## 1. PAYMENT_CREATED (BOLETO)

```bash
curl -X POST http://localhost:3000/api/asaas/webhook \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: dev-token" \
  -d '{
    "id": "evt_000001",
    "event": "PAYMENT_CREATED",
    "dateCreated": "2026-03-03T15:00:00.000Z",
    "payment": {
      "id": "pay_000001",
      "subscription": "sub_000001",
      "billingType": "BOLETO",
      "status": "PENDING",
      "value": 199.9,
      "dueDate": "2026-03-04",
      "invoiceUrl": "https://www.asaas.com/i/pay_000001",
      "bankSlipUrl": "https://www.asaas.com/b/pdf/pay_000001"
    }
}'
```

## 2. PAYMENT_RECEIVED (Confirmação de Fatura Paga)

```bash
curl -X POST http://localhost:3000/api/asaas/webhook \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: dev-token" \
  -d '{
    "id": "evt_000002",
    "event": "PAYMENT_RECEIVED",
    "dateCreated": "2026-03-03T16:00:00.000Z",
    "payment": {
      "id": "pay_000001",
      "subscription": "sub_000001",
      "billingType": "BOLETO",
      "status": "RECEIVED",
      "value": 199.9,
      "dueDate": "2026-03-04",
      "invoiceUrl": "https://www.asaas.com/i/pay_000001",
      "bankSlipUrl": "https://www.asaas.com/b/pdf/pay_000001"
    }
}'
```

## 3. PAYMENT_OVERDUE (Atrasada)

```bash
curl -X POST http://localhost:3000/api/asaas/webhook \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: dev-token" \
  -d '{
    "id": "evt_000003",
    "event": "PAYMENT_OVERDUE",
    "dateCreated": "2026-03-05T00:00:00.000Z",
    "payment": {
      "id": "pay_OVERDUE1",
      "subscription": "sub_000001",
      "billingType": "PIX",
      "status": "OVERDUE",
      "value": 199.9,
      "dueDate": "2026-03-04",
      "invoiceUrl": "https://www.asaas.com/i/pay_OVERDUE1"
    }
}'
```

## 4. PAYMENT_CREATED (PIX Dinâmico e Copia e Cola)

```bash
curl -X POST http://localhost:3000/api/asaas/webhook \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: dev-token" \
  -d '{
    "id": "evt_000004",
    "event": "PAYMENT_CREATED",
    "dateCreated": "2026-03-03T15:30:00.000Z",
    "payment": {
      "id": "pay_000002",
      "subscription": "sub_000001",
      "billingType": "PIX",
      "status": "PENDING",
      "value": 199.9,
      "dueDate": "2026-03-04",
      "invoiceUrl": "https://www.asaas.com/i/pay_000002",
      "pixCopiaECola": "00020101021226900014br.gov.bcb.pix..."
    }
}'
```
