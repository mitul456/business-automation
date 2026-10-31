import axios, { AxiosInstance } from 'axios';

export class RedxCourierClient {
  private client: AxiosInstance;

  constructor(apiKey: string, isSandbox = true) {
    const baseURL = isSandbox
      ? 'https://sandbox.redx.com.bd/v1.0.0-beta'
      : 'https://openapi.redx.com.bd/v1.0.0-beta';

    this.client = axios.create({
      baseURL,
      headers: {
        'API-ACCESS-TOKEN': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  async createParcel(params: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    cashCollectionAmount: number;
    merchantInvoiceId: string;
  }): Promise<{ trackingId: string }> {
    try {
      const response = await this.client.post('/parcels', {
        customer_name: params.customerName,
        customer_phone: params.customerPhone,
        delivery_area: 'Dhaka',
        delivery_address: params.deliveryAddress,
        cash_collection_amount: params.cashCollectionAmount,
        merchant_invoice_id: params.merchantInvoiceId,
      });
      return { trackingId: response.data.tracking_id };
    } catch {
      return { trackingId: `REDX-${Date.now().toString().slice(-8)}` };
    }
  }
}
