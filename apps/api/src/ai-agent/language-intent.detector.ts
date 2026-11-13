import { AiLanguage } from '@omniflow/shared';

export enum DetectedIntent {
  GREETING = 'GREETING',
  PRODUCT_INQUIRY = 'PRODUCT_INQUIRY',
  PRICE_CHECK = 'PRICE_CHECK',
  ORDER_CREATION = 'ORDER_CREATION',
  ORDER_STATUS = 'ORDER_STATUS',
  BOOKING_REQUEST = 'BOOKING_REQUEST',
  FAQ_POLICY = 'FAQ_POLICY',
  HUMAN_HANDOVER = 'HUMAN_HANDOVER',
  GENERAL_CHAT = 'GENERAL_CHAT',
}

export interface LanguageIntentDetectionResult {
  language: AiLanguage;
  detectedLanguageName: 'Bengali' | 'English' | 'Banglish';
  confidence: number;
  intent: DetectedIntent;
  intentConfidence: number;
}

export class LanguageIntentDetector {
  private static readonly PURE_BANGLISH_MARKERS = new Set([
    'bhai', 'apnader', 'apnar', 'ache', 'koto', 'dam', 'hobe', 'nibo',
    'dekhan', 'pathan', 'dibo', 'lagbe', 'khub', 'valo', 'shondor',
    'kemon', 'korbo', 'kobe', 'ashbe', 'chole', 'dekhaben', 'chai',
    'bolen', 'kothay', 'thikana', 'ekhon', 'bhalo', 'amader', 'amar',
    'tumi', 'apni', 'taka', 'shathe', 'ekta', 'duto', 'nibo'
  ]);

  private static readonly ENGLISH_STOPWORDS = new Set([
    'the', 'is', 'in', 'and', 'what', 'do', 'you', 'have', 'this', 'that',
    'to', 'for', 'with', 'we', 'are', 'can', 'how', 'when', 'why', 'where',
    'time', 'please', 'stock', 'delivery', 'charge', 'order', 'status'
  ]);

  /**
   * Detects whether user message is in Bengali, English, or Banglish
   */
  static detectLanguage(text: string): { language: AiLanguage; name: 'Bengali' | 'English' | 'Banglish'; confidence: number } {
    if (!text || !text.trim()) {
      return { language: AiLanguage.ENGLISH, name: 'English', confidence: 0.5 };
    }

    const clean = text.trim();

    // 1. Check for Bengali Unicode character block (\u0980-\u09FF)
    const bengaliChars = clean.match(/[\u0980-\u09FF]/g);
    if (bengaliChars && bengaliChars.length / clean.length > 0.15) {
      return { language: AiLanguage.BENGALI, name: 'Bengali', confidence: 0.95 };
    }

    // 2. Tokenize words
    const words = clean.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    let banglishMarkerCount = 0;
    let englishWordCount = 0;

    for (const w of words) {
      if (this.PURE_BANGLISH_MARKERS.has(w)) {
        banglishMarkerCount++;
      }
      if (this.ENGLISH_STOPWORDS.has(w)) {
        englishWordCount++;
      }
    }

    // If pure Banglish phonetic markers are present and outnumber/match english stopwords
    if (banglishMarkerCount >= 1 && banglishMarkerCount >= englishWordCount) {
      return { language: AiLanguage.BANGLISH, name: 'Banglish', confidence: 0.9 };
    }

    // If pure Banglish markers exist in significant ratio
    if (banglishMarkerCount >= 2) {
      return { language: AiLanguage.BANGLISH, name: 'Banglish', confidence: 0.88 };
    }

    // 3. Default to English
    return { language: AiLanguage.ENGLISH, name: 'English', confidence: 0.9 };
  }

  /**
   * Identifies customer intent from message and context
   */
  static detectIntent(text: string, hasImage = false): { intent: DetectedIntent; confidence: number } {
    if (!text && hasImage) {
      return { intent: DetectedIntent.PRODUCT_INQUIRY, confidence: 0.9 };
    }

    const lower = (text || '').toLowerCase();

    // Handover triggers
    if (
      lower.includes('human') ||
      lower.includes('agent') ||
      lower.includes('support') ||
      lower.includes('প্রতিনিধি') ||
      lower.includes('কথা বলতে চাই') ||
      lower.includes('মানুষ') ||
      lower.includes('manush') ||
      lower.includes('kotha bolte chai')
    ) {
      return { intent: DetectedIntent.HUMAN_HANDOVER, confidence: 0.95 };
    }

    // Order Creation intent
    if (
      lower.includes('order korte chai') ||
      lower.includes('অর্ডার করতে চাই') ||
      lower.includes('অর্ডার দিন') ||
      lower.includes('place order') ||
      lower.includes('buy now') ||
      lower.includes('nibo') ||
      lower.includes('নিতে চাই') ||
      lower.includes('address:') ||
      lower.includes('ঠিকানা')
    ) {
      return { intent: DetectedIntent.ORDER_CREATION, confidence: 0.92 };
    }

    // Order Status intent
    if (
      lower.includes('track') ||
      lower.includes('status') ||
      lower.includes('kobe pabo') ||
      lower.includes('কবে পাব') ||
      lower.includes('কবে আসবে') ||
      lower.includes('delivery status') ||
      lower.includes('order number') ||
      lower.includes('পার্সেল')
    ) {
      return { intent: DetectedIntent.ORDER_STATUS, confidence: 0.88 };
    }

    // Booking Appointment intent
    if (
      lower.includes('appointment') ||
      lower.includes('booking') ||
      lower.includes('schedule') ||
      lower.includes('অ্যাপয়েন্টমেন্ট') ||
      lower.includes('বুকিং') ||
      lower.includes('সময় নির্ধারণ')
    ) {
      return { intent: DetectedIntent.BOOKING_REQUEST, confidence: 0.9 };
    }

    // Price Check intent
    if (
      lower.includes('dam koto') ||
      lower.includes('দাম কত') ||
      lower.includes('price') ||
      lower.includes('cost') ||
      lower.includes('মূল্য') ||
      lower.includes('rate') ||
      lower.includes('koto taka')
    ) {
      return { intent: DetectedIntent.PRICE_CHECK, confidence: 0.91 };
    }

    // Product inquiry
    if (
      hasImage ||
      lower.includes('stock') ||
      lower.includes('available') ||
      lower.includes('size') ||
      lower.includes('ache') ||
      lower.includes('আছে') ||
      lower.includes('colour') ||
      lower.includes('color') ||
      lower.includes('দেখান') ||
      lower.includes('dekhan') ||
      lower.includes('details')
    ) {
      return { intent: DetectedIntent.PRODUCT_INQUIRY, confidence: 0.85 };
    }

    // FAQ / Delivery policy
    if (
      lower.includes('delivery charge') ||
      lower.includes('ডেলিভারি চার্জ') ||
      lower.includes('cod') ||
      lower.includes('cash on delivery') ||
      lower.includes('bkash') ||
      lower.includes('বিকাশ') ||
      lower.includes('return') ||
      lower.includes('exchange') ||
      lower.includes('পলিসি')
    ) {
      return { intent: DetectedIntent.FAQ_POLICY, confidence: 0.87 };
    }

    // Greetings
    if (
      lower.includes('hello') ||
      lower.includes('hi') ||
      lower.includes('salam') ||
      lower.includes('সালাম') ||
      lower.includes('hey')
    ) {
      return { intent: DetectedIntent.GREETING, confidence: 0.95 };
    }

    return { intent: DetectedIntent.GENERAL_CHAT, confidence: 0.7 };
  }

  /**
   * Combined detection pipeline
   */
  static analyze(text: string, hasImage = false): LanguageIntentDetectionResult {
    const lang = this.detectLanguage(text);
    const intentRes = this.detectIntent(text, hasImage);

    return {
      language: lang.language,
      detectedLanguageName: lang.name,
      confidence: lang.confidence,
      intent: intentRes.intent,
      intentConfidence: intentRes.confidence,
    };
  }
}
