import "server-only";

const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '';

if (!ASAAS_API_KEY) {
    console.warn("ASAAS_API_KEY não localizada em variaveis de ambiente. Requisicoes bancarias irão falhar.");
}

async function asaasFetch(endpoint: string, options: RequestInit = {}) {
    const url = `${ASAAS_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'access_token': ASAAS_API_KEY,
            ...(options.headers || {}),
        },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("Asaas Error Status:", response.status, data);
        throw new Error(data.errors?.[0]?.description || 'Erro na requisição ao Asaas');
    }

    return data;
}

export const clienteAsaas = {
    async createCustomer(data: { name: string, email: string, cpfCnpj?: string, phone?: string, externalReference?: string }) {
        return asaasFetch('/customers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateCustomer(id: string, data: { name?: string, email?: string, cpfCnpj?: string, phone?: string }) {
        return asaasFetch(`/customers/${id}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async findCustomerByExternalRef(externalReference: string) {
        const result = await asaasFetch(`/customers?externalReference=${externalReference}`);
        return result.data && result.data.length > 0 ? result.data[0] : null;
    },

    async createSubscription(data: { customer: string, billingType: string, value: number, nextDueDate: string, cycle: string, description: string, externalReference?: string }) {
        return asaasFetch('/subscriptions', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
};
