export interface GuardrailValidationResult {
  isValid: boolean;
  sanitizedInput: string;
  flaggedReasons: string[];
  preventExecution: boolean;
}

export interface PriceCheckProduct {
  name: string;
  price: number;
  sku?: string;
  stockQuantity?: number;
}

export class SafetyGuardrails {
  private static readonly INJECTION_PATTERNS = [
    /ignore (all )?(previous|above) instructions/i,
    /disregard (all )?(previous|system) prompts/i,
    /system prompt/i,
    /reveal your instructions/i,
    /what are your instructions/i,
    /print your prompt/i,
    /developer mode/i,
    /dan mode/i,
    /bypass security/i,
    /override your rules/i,
  ];

  /**
   * Sanitizes untrusted user inputs & checks for prompt injection attempts
   */
  static validateAndSanitizeInput(userInput: string): GuardrailValidationResult {
    const flaggedReasons: string[] = [];
    let preventExecution = false;

    // 1. Check for prompt injection attempts
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(userInput)) {
        flaggedReasons.push(`Potential prompt injection pattern detected: ${pattern}`);
        preventExecution = true;
        break;
      }
    }

    // 2. Remove dangerous control characters or null bytes
    const sanitized = userInput
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .trim();

    return {
      isValid: flaggedReasons.length === 0,
      sanitizedInput: sanitized,
      flaggedReasons,
      preventExecution,
    };
  }

  /**
   * Cross-checks AI response claims against verified database products to prevent hallucinations
   */
  static validateResponseClaims(
    responseContent: string,
    verifiedProducts: PriceCheckProduct[]
  ): {
    isHallucinationFree: boolean;
    hallucinationNotes: string[];
    correctedResponse: string;
  } {
    const notes: string[] = [];
    let corrected = responseContent;

    // Extract price claims like ৳2500, ৳ 2,500, BDT 2500, Tk 2500, 2500 taka
    const priceRegex = /(?:৳|BDT|Tk\.?)\s*(\d[\d,]*)|(\d[\d,]*)\s*(?:টাকা|taka)/gi;
    const claimedPrices: number[] = [];
    let match;

    while ((match = priceRegex.exec(responseContent)) !== null) {
      const priceStr = (match[1] || match[2]).replace(/,/g, '');
      const parsed = parseFloat(priceStr);
      if (!isNaN(parsed) && parsed > 50) { // Ignore small numbers like delivery fee 60/120
        claimedPrices.push(parsed);
      }
    }

    if (claimedPrices.length > 0 && verifiedProducts.length > 0) {
      const validPrices = new Set(verifiedProducts.map((p) => p.price));

      for (const claimed of claimedPrices) {
        // If claimed price is not found in verified products and not standard delivery charges (60, 100, 120, 150)
        const isDeliveryCharge = [50, 60, 70, 80, 100, 120, 130, 150].includes(claimed);
        if (!validPrices.has(claimed) && !isDeliveryCharge) {
          notes.push(`AI claimed price ৳${claimed} which was not verified against active products: [${Array.from(validPrices).join(', ')}]`);
        }
      }
    }

    return {
      isHallucinationFree: notes.length === 0,
      hallucinationNotes: notes,
      correctedResponse: corrected,
    };
  }

  /**
   * Verifies if an action is permitted under workspace capability settings
   */
  static verifyActionPermitted(
    actionName: string,
    capabilities: Record<string, boolean>
  ): { permitted: boolean; reason?: string } {
    if (!capabilities) {
      return { permitted: false, reason: 'No capabilities configured for workspace' };
    }

    const mapping: Record<string, string> = {
      order_creation: 'autoOrderCreation',
      product_search: 'productSearch',
      image_recognition: 'imageRecognition',
      voice_transcription: 'voiceTranscription',
      booking_appointment: 'bookingAppointment',
    };

    const configKey = mapping[actionName] || actionName;

    if (capabilities[configKey] === false) {
      return {
        permitted: false,
        reason: `Action '${actionName}' (${configKey}) is explicitly disabled in workspace AI settings`,
      };
    }

    return { permitted: true };
  }
}
