export interface AsaasCustomerData {
    name: string;
    email: string;
    phone?: string;
    mobilePhone?: string;
    cpfCnpj?: string;
    externalReference?: string;
}

export interface AsaasSubscriptionData {
    customer: string;
    billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'UNDEFINED';
    value: number;
    nextDueDate: string; // YYYY-MM-DD
    cycle: 'MONTHLY' | 'YEARLY' | 'SEMIANNUALLY';
    description?: string;
    externalReference?: string;
}

export class AsaasClient {
    private readonly baseUrl: string;
    private readonly apiKey: string;

    constructor() {
        this.baseUrl = process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3';
        this.apiKey = process.env.ASAAS_API_KEY || '';

        if (!this.apiKey && process.env.NODE_ENV === 'production') {
            console.warn('API Key do Asaas não configurada no ambiente.');
        }
    }

    private async fetchAsaas(endpoint: string, options: RequestInit = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'access_token': this.apiKey,
            ...options.headers,
        };

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Asaas API Error (${response.status}): ${JSON.stringify(errorData)}`);
        }

        return response.json();
    }

    async createCustomer(data: AsaasCustomerData): Promise<{ id: string }> {
        return this.fetchAsaas('/customers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async createSubscription(data: AsaasSubscriptionData): Promise<{ id: string }> {
        return this.fetchAsaas('/subscriptions', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Idempotency token concept might be implemented via query search prior to creation
    async findCustomerByExternalRef(externalRef: string): Promise<any | null> {
        const res = await this.fetchAsaas(`/customers?externalReference=${externalRef}`);
        if (res.data && res.data.length > 0) {
            return res.data[0];
        }
        return null;
    }
}

export const asaasClient = new AsaasClient();
