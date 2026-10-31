import axios from 'axios';

export interface StripeConfig {
  secretKey: string;
  webhookSecret?: string;
}

export class StripeClient {
  private secretKey: string;

  constructor(config: StripeConfig) {
    this.secretKey = config.secretKey;
  }

  /**
   * Create Stripe Checkout session for subscription or credit purchase
   */
  async createCheckoutSession(params: {
    customerEmail?: string;
    lineItems: Array<{ name: string; amount: number; quantity: number }>;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<{ sessionId: string; checkoutUrl: string }> {
    if (!this.secretKey) {
      const mockId = `cs_test_${Date.now()}`;
      return {
        sessionId: mockId,
        checkoutUrl: `https://checkout.stripe.com/pay/${mockId}`,
      };
    }

    const payload = new URLSearchParams();
    payload.append('payment_method_types[0]', 'card');
    payload.append('mode', 'payment');
    payload.append('success_url', params.successUrl);
    payload.append('cancel_url', params.cancelUrl);
    if (params.customerEmail) payload.append('customer_email', params.customerEmail);

    params.lineItems.forEach((item, index) => {
      payload.append(`line_items[${index}][price_data][currency]`, 'usd');
      payload.append(`line_items[${index}][price_data][product_data][name]`, item.name);
      payload.append(`line_items[${index}][price_data][unit_amount]`, Math.round(item.amount * 100).toString());
      payload.append(`line_items[${index}][quantity]`, item.quantity.toString());
    });

    if (params.metadata) {
      Object.entries(params.metadata).forEach(([key, val]) => {
        payload.append(`metadata[${key}]`, val);
      });
    }

    const response = await axios.post('https://api.stripe.com/v1/checkout/sessions', payload, {
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return {
      sessionId: response.data.id,
      checkoutUrl: response.data.url,
    };
  }
}
