'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { ApiClient } from '@/lib/api';
import {
  MessageSquare,
  Bot,
  User,
  Send,
  Phone,
  MapPin,
  ShoppingBag,
  Sparkles,
  Headphones,
  Play,
  Pause,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Search,
  Filter,
  CreditCard,
  Plus,
  CheckCircle2,
  Clock,
  Lock,
  Tag,
  X,
  FileText,
  AlertCircle,
  Volume2,
  Paperclip,
  Smile,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Truck,
  Package,
  Mic,
  VolumeX,
} from 'lucide-react';
import { Button, Input, Badge, Card, Modal } from '@omniflow/ui';

interface ConversationItem {
  id: string;
  customer: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    city?: string;
    address?: string;
    leadStage?: string;
    totalOrders: number;
    totalSpent: number;
    tags?: string[];
  };
  channel: { type: string; name: string };
  status: 'BOT_ACTIVE' | 'HUMAN_HANDOVER' | 'CLOSED';
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount: number;
  aiAssisted: boolean;
  assignedMemberId?: string | null;
  assignedMember?: { user: { name: string } };
}

interface MessageItem {
  id: string;
  senderType: 'CUSTOMER' | 'AGENT' | 'BOT' | 'SYSTEM';
  content: string;
  contentType: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'FILE' | 'PRODUCT_CARD' | 'ORDER_CARD';
  mediaUrl?: string;
  mediaMetadata?: any;
  voiceReplyUrl?: string;
  isInternal?: boolean;
  deliveryStatus?: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  aiGenerated?: boolean;
  tokensUsed?: number;
  createdAt: string;
}

export default function InboxPage() {
  const { activeTenant } = useAuth();
  const { t } = useI18n();

  // LEFT PANEL FILTERS
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'FACEBOOK_PAGE' | 'WHATSAPP_BUSINESS' | 'INSTAGRAM'>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'BOT' | 'HUMAN' | 'UNREAD'>('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string>('conv-1');

  // CENTER PANEL STATE
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [mediaAttachmentUrl, setMediaAttachmentUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // PRODUCT CARD CAROUSEL & VARIANT STATE
  const [cardImageIndices, setCardImageIndices] = useState<Record<string, number>>({});
  const [cardSelectedSizes, setCardSelectedSizes] = useState<Record<string, string>>({ 'prod-card-1': '42' });

  // ORDER PLACEMENT MODAL STATE
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderProduct, setOrderProduct] = useState<any>(null);
  const [orderSize, setOrderSize] = useState('42');
  const [orderColor, setOrderColor] = useState('Navy Blue');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderCustomerName, setOrderCustomerName] = useState('Tanvir Ahmed');
  const [orderCustomerPhone, setOrderCustomerPhone] = useState('+8801712345678');
  const [orderCustomerAddress, setOrderCustomerAddress] = useState('House 42, Road 11, Sector 4, Uttara, Dhaka');
  const [deliveryArea, setDeliveryArea] = useState<'INSIDE_DHAKA' | 'OUTSIDE_DHAKA'>('INSIDE_DHAKA');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessToast, setOrderSuccessToast] = useState<string | null>(null);

  // RIGHT PANEL STATE
  const [newTagInput, setNewTagInput] = useState('');
  const [aiSummary, setAiSummary] = useState<{ summary: string; sentiment: string; keyPoints: string[] }>({
    summary: 'Customer inquired about Royal Navy Blue Panjabi (size 42) stock & Cash on Delivery delivery rates for Dhaka/Chittagong.',
    sentiment: 'POSITIVE',
    keyPoints: [
      'Customer interested in Panjabi size 42',
      'Address provided: Sector 4, Uttara, Dhaka',
      'Ready for automated COD order confirmation',
    ],
  });

  // Conversations Dataset
  const [conversations, setConversations] = useState<ConversationItem[]>([
    {
      id: 'conv-1',
      customer: {
        id: 'cust-1',
        name: 'Tanvir Ahmed',
        phone: '+8801712345678',
        email: 'tanvir@example.com',
        city: 'Dhaka',
        address: 'House 42, Road 11, Sector 4, Uttara',
        leadStage: 'QUALIFIED',
        totalOrders: 1,
        totalSpent: 2910,
        tags: ['VIP Buyer', 'COD Preferred'],
      },
      channel: { type: 'FACEBOOK_PAGE', name: 'Apex Facebook Messenger' },
      status: 'BOT_ACTIVE',
      lastMessagePreview: 'আপনাদের নীল পাঞ্জাবিটার সাইজ ৪২ কি স্টকে আছে?',
      lastMessageAt: '10:18 AM',
      unreadCount: 0,
      aiAssisted: true,
      assignedMemberId: null,
    },
    {
      id: 'conv-2',
      customer: {
        id: 'cust-2',
        name: 'Nusrat Jahan',
        phone: '+8801812345678',
        email: 'nusrat@example.com',
        city: 'Chittagong',
        address: 'GEC Circle, Nasirabad, Chittagong',
        leadStage: 'CONTACTED',
        totalOrders: 0,
        totalSpent: 0,
        tags: ['Voice Note Lead', 'Chittagong Delivery'],
      },
      channel: { type: 'WHATSAPP_BUSINESS', name: 'Apex WhatsApp Support' },
      status: 'HUMAN_HANDOVER',
      lastMessagePreview: 'Customer sent a voice note 🎙️',
      lastMessageAt: '09:45 AM',
      unreadCount: 2,
      aiAssisted: false,
      assignedMemberId: 'mem-1',
      assignedMember: { user: { name: 'Support Agent' } },
    },
    {
      id: 'conv-3',
      customer: {
        id: 'cust-3',
        name: 'Farhan Kabir',
        phone: '+8801912345678',
        email: 'farhan@example.com',
        city: 'Sylhet',
        address: 'Zindabazar, Sylhet',
        leadStage: 'QUALIFIED',
        totalOrders: 2,
        totalSpent: 5700,
        tags: ['Repeat Buyer', 'Fashion Watch'],
      },
      channel: { type: 'INSTAGRAM', name: 'Apex Instagram Direct' },
      status: 'BOT_ACTIVE',
      lastMessagePreview: 'Customer shared a product photo 📷',
      lastMessageAt: 'Yesterday',
      unreadCount: 0,
      aiAssisted: true,
      assignedMemberId: null,
    },
  ]);

  // Messages in Active Conversation
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'm1',
      senderType: 'CUSTOMER',
      content: 'আসসালামু আলাইকুম, আপনাদের নীল পাঞ্জাবিটার সাইজ ৪২ কি স্টকে আছে?',
      contentType: 'TEXT',
      deliveryStatus: 'READ',
      createdAt: '10:14 AM',
    },
    {
      id: 'm2',
      senderType: 'BOT',
      content: 'ওয়ালাইকুম আসসালাম! জি, আমাদের "Royal Navy Blue Embroidered Panjabi" সাইজ ৪২ স্টকে ১৫ পিস অ্যাভেইলেবল আছে। মূল্য ২,৮৫০ টাকা। নিচে প্রোডাক্টের সম্পূর্ণ গ্যালারি ও ডিটেইলস দেওয়া হলো। ক্যাশ অন ডেলিভারিতে অর্ডার করতে "Buy Now / অর্ডার করুন" বাটনে ক্লিক করুন।',
      contentType: 'TEXT',
      voiceReplyUrl: 'mock_voice_reply_nova.mp3',
      aiGenerated: true,
      tokensUsed: 65,
      deliveryStatus: 'READ',
      createdAt: '10:14 AM',
    },
    {
      id: 'prod-card-1',
      senderType: 'BOT',
      content: 'Royal Navy Blue Embroidered Panjabi',
      contentType: 'PRODUCT_CARD',
      mediaMetadata: {
        id: 'prod-1',
        name: 'Royal Navy Blue Embroidered Panjabi',
        sku: 'PJ-ROYAL-NAVY-M',
        price: 2850,
        compareAtPrice: 3500,
        stockQuantity: 45,
        images: [
          'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop',
        ],
        variants: [
          { size: '38', color: 'Navy Blue', stockQuantity: 12 },
          { size: '40', color: 'Navy Blue', stockQuantity: 18 },
          { size: '42', color: 'Navy Blue', stockQuantity: 15 },
          { size: '44', color: 'Navy Blue', stockQuantity: 0 },
        ],
        description: 'Exclusive 100% combed cotton festive Panjabi with subtle mandarin collar embroidery.',
      },
      aiGenerated: true,
      deliveryStatus: 'READ',
      createdAt: '10:15 AM',
    },
    {
      id: 'm3',
      senderType: 'CUSTOMER',
      content: 'হ্যাঁ, আমি ১ পিস নিবো। নাম: তানভীর আহমেদ, উত্তরা সেক্টর ৪, ঢাকা। ফোন: ০১৭১২৩৪৫৬৭৮।',
      contentType: 'TEXT',
      deliveryStatus: 'READ',
      createdAt: '10:18 AM',
    },
    {
      id: 'm4',
      senderType: 'AGENT',
      content: 'Internal Note: Checked stock in Uttara hub - 3 pieces remaining. Free delivery applicable for second purchase.',
      contentType: 'TEXT',
      isInternal: true,
      deliveryStatus: 'READ',
      createdAt: '10:20 AM',
    },
  ]);

  const activeConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  // Load from API on mount
  useEffect(() => {
    ApiClient.get<any>('/inbox/conversations')
      .then((data) => {
        if (data && data.conversations && data.conversations.length > 0) {
          setConversations(data.conversations);
        }
      })
      .catch(() => {});
  }, []);

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    // Channel filter
    if (channelFilter !== 'ALL' && c.channel.type !== channelFilter) return false;

    // Mode filter
    if (modeFilter === 'BOT' && c.status !== 'BOT_ACTIVE') return false;
    if (modeFilter === 'HUMAN' && c.status !== 'HUMAN_HANDOVER') return false;
    if (modeFilter === 'UNREAD' && c.unreadCount === 0) return false;

    // Assignment filter
    if (assignmentFilter === 'ASSIGNED' && !c.assignedMemberId) return false;
    if (assignmentFilter === 'UNASSIGNED' && c.assignedMemberId) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.customer.name.toLowerCase().includes(q);
      const matchPhone = c.customer.phone?.includes(q);
      const matchPreview = c.lastMessagePreview.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchPreview) return false;
    }

    return true;
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && !mediaAttachmentUrl) return;

    const newMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      senderType: 'AGENT',
      content: replyText,
      contentType: mediaAttachmentUrl ? 'IMAGE' : 'TEXT',
      mediaUrl: mediaAttachmentUrl || undefined,
      isInternal: isInternalNote,
      deliveryStatus: isInternalNote ? 'READ' : 'SENT',
      createdAt: 'Just now',
    };

    setMessages((prev) => [...prev, newMsg]);
    setReplyText('');
    setMediaAttachmentUrl('');
    setIsSending(true);

    try {
      await ApiClient.post('/inbox/messages', {
        conversationId: activeConv.id,
        content: newMsg.content,
        contentType: newMsg.contentType,
        mediaUrl: newMsg.mediaUrl,
        isInternal: newMsg.isInternal,
      });
    } catch {
      // Offline mode preview
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenOrderModal = (product: any, defaultSize?: string) => {
    setOrderProduct(product);
    if (defaultSize) {
      setOrderSize(defaultSize);
    } else if (product.variants && product.variants.length > 0) {
      setOrderSize(product.variants[0].size || '42');
    }
    setOrderCustomerName(activeConv.customer.name);
    setOrderCustomerPhone(activeConv.customer.phone || '+8801712345678');
    setOrderCustomerAddress(activeConv.customer.address || 'House 42, Road 11, Sector 4, Uttara, Dhaka');
    setIsOrderModalOpen(true);
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderProduct) return;
    setIsSubmittingOrder(true);

    const deliveryCost = deliveryArea === 'INSIDE_DHAKA' ? 60 : 120;
    const subtotal = orderProduct.price * orderQuantity;
    const totalAmount = subtotal + deliveryCost;
    const year = new Date().getFullYear();
    const orderNumber = `ORD-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await ApiClient.post(`/inbox/conversations/${activeConv.id}/quick-order`, {
        productId: orderProduct.id || 'prod-1',
        productName: orderProduct.name,
        variantSize: orderSize,
        variantColor: orderColor,
        quantity: orderQuantity,
        unitPrice: orderProduct.price,
        customerName: orderCustomerName,
        customerPhone: orderCustomerPhone,
        customerAddress: orderCustomerAddress,
        deliveryArea,
        deliveryCost,
        notes: orderNotes,
      });
    } catch {
      // In offline / fallback preview
    }

    // Append Order Confirmation Card to messages
    const newOrderMsg: MessageItem = {
      id: `ord-msg-${Date.now()}`,
      senderType: 'BOT',
      content: `🎉 অর্ডার নিশ্চিত হয়েছে (#${orderNumber})!\nআইটেম: ${orderProduct.name}\nসাইজ: ${orderSize} | কালার: ${orderColor} | পরিমাণ: ${orderQuantity} টি\nমোট প্রদেয়: ৳${totalAmount.toLocaleString()} BDT (ডেলিভারি চার্জ সহ)\nপেমেন্ট মেথড: ক্যাশ অন ডেলিভারি (COD)\nডেলিভারি ঠিকানা: ${orderCustomerAddress}, ${deliveryArea === 'INSIDE_DHAKA' ? 'ঢাকা' : 'ঢাকার বাইরে'}\nডেলিভারি সময়: ${deliveryArea === 'INSIDE_DHAKA' ? '২৪-৪৮ ঘণ্টার মধ্যে' : '২-৩ দিনের মধ্যে'}। ধন্যবাদ!`,
      contentType: 'ORDER_CARD',
      mediaMetadata: {
        orderNumber,
        productName: orderProduct.name,
        size: orderSize,
        color: orderColor,
        quantity: orderQuantity,
        totalAmount,
        deliveryCost,
        shippingAddress: orderCustomerAddress,
        deliveryArea: deliveryArea === 'INSIDE_DHAKA' ? 'Inside Dhaka (24-48 hrs)' : 'Outside Dhaka (48-72 hrs)',
      },
      aiGenerated: true,
      deliveryStatus: 'SENT',
      createdAt: 'Just now',
    };

    setMessages((prev) => [...prev, newOrderMsg]);

    // Update conversation metrics
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? {
              ...c,
              lastMessagePreview: `Order #${orderNumber} placed (৳${totalAmount.toLocaleString()})`,
              customer: {
                ...c.customer,
                totalOrders: c.customer.totalOrders + 1,
                totalSpent: c.customer.totalSpent + totalAmount,
              },
            }
          : c
      )
    );

    setIsSubmittingOrder(false);
    setIsOrderModalOpen(false);
    setOrderSuccessToast(`Order #${orderNumber} placed successfully!`);
    setTimeout(() => setOrderSuccessToast(null), 5000);
  };

  const handleSimulateVoiceNote = async () => {
    const custVoiceMsg: MessageItem = {
      id: `voice-${Date.now()}`,
      senderType: 'CUSTOMER',
      content: 'ভাই আপনাদের নীল পাঞ্জাবিটার সাইজ ৪২ কি স্টকে আছে? ক্যাশ অন ডেলিভারিতে নিতে চাচ্ছিলাম।',
      contentType: 'AUDIO',
      mediaUrl: 'mock_audio.ogg',
      deliveryStatus: 'READ',
      createdAt: 'Just now',
    };

    setMessages((prev) => [...prev, custVoiceMsg]);

    setTimeout(() => {
      const botVoiceReply: MessageItem = {
        id: `bot-reply-${Date.now()}`,
        senderType: 'BOT',
        content: 'ওয়ালাইকুম আসসালাম! জি, আমাদের "Royal Navy Blue Embroidered Panjabi" সাইজ ৪২ স্টকে ১৫ পিস অ্যাভেইলেবল আছে। মূল্য ২,৮৫০ টাকা। নিচে প্রোডাক্টের সম্পূর্ণ গ্যালারি ও ডিটেইলস দেওয়া হলো। ক্যাশ অন ডেলিভারিতে নিতে নিচের "Buy Now / অর্ডার করুন" বাটনে চাপুন।',
        contentType: 'TEXT',
        voiceReplyUrl: 'mock_tts_nova.mp3',
        aiGenerated: true,
        tokensUsed: 72,
        deliveryStatus: 'SENT',
        createdAt: 'Just now',
      };

      const productCardMsg: MessageItem = {
        id: `card-${Date.now()}`,
        senderType: 'BOT',
        content: 'Royal Navy Blue Embroidered Panjabi',
        contentType: 'PRODUCT_CARD',
        mediaMetadata: {
          id: 'prod-1',
          name: 'Royal Navy Blue Embroidered Panjabi',
          sku: 'PJ-ROYAL-NAVY-M',
          price: 2850,
          compareAtPrice: 3500,
          stockQuantity: 45,
          images: [
            'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop',
          ],
          variants: [
            { size: '38', color: 'Navy Blue', stockQuantity: 12 },
            { size: '40', color: 'Navy Blue', stockQuantity: 18 },
            { size: '42', color: 'Navy Blue', stockQuantity: 15 },
            { size: '44', color: 'Navy Blue', stockQuantity: 0 },
          ],
          description: 'Exclusive 100% combed cotton festive Panjabi with subtle mandarin collar embroidery.',
        },
        aiGenerated: true,
        deliveryStatus: 'SENT',
        createdAt: 'Just now',
      };

      setMessages((prev) => [...prev, botVoiceReply, productCardMsg]);
    }, 800);
  };

  const handleSimulateImageSearch = async () => {
    const custImgMsg: MessageItem = {
      id: `img-${Date.now()}`,
      senderType: 'CUSTOMER',
      content: 'এই পাঞ্জাবিটা আপনাদের কাছে আছে? দাম কত আর কি কি সাইজ হবে?',
      contentType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&auto=format&fit=crop',
      deliveryStatus: 'READ',
      createdAt: 'Just now',
    };

    setMessages((prev) => [...prev, custImgMsg]);

    setTimeout(() => {
      const botVisionReply: MessageItem = {
        id: `bot-vis-${Date.now()}`,
        senderType: 'BOT',
        content: 'ধন্যবাদ! আপনার পাঠানো ছবিটি GPT-4o Vision দিয়ে এনালাইসিস করে আমাদের ক্যাটালগের "Royal Navy Blue Embroidered Panjabi"-এর সাথে ১০০% ম্যাচ পাওয়া গেছে। এটি ১০০% প্রিমিয়াম সুতি কাপড়ে তৈরি। নিচে ৪টি ভিন্ন অ্যাঙ্গেলের গ্যালারি ছবি ও বিস্তারিত দেওয়া হলো। ক্যাশ অন ডেলিভারিতে অর্ডার করতে "Buy Now" বাটনে ক্লিক করুন।',
        contentType: 'TEXT',
        aiGenerated: true,
        tokensUsed: 85,
        deliveryStatus: 'SENT',
        createdAt: 'Just now',
      };

      const productCardMsg: MessageItem = {
        id: `card-vis-${Date.now()}`,
        senderType: 'BOT',
        content: 'Royal Navy Blue Embroidered Panjabi',
        contentType: 'PRODUCT_CARD',
        mediaMetadata: {
          id: 'prod-1',
          name: 'Royal Navy Blue Embroidered Panjabi',
          sku: 'PJ-ROYAL-NAVY-M',
          price: 2850,
          compareAtPrice: 3500,
          stockQuantity: 45,
          images: [
            'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop',
          ],
          variants: [
            { size: '38', color: 'Navy Blue', stockQuantity: 12 },
            { size: '40', color: 'Navy Blue', stockQuantity: 18 },
            { size: '42', color: 'Navy Blue', stockQuantity: 15 },
            { size: '44', color: 'Navy Blue', stockQuantity: 0 },
          ],
          description: 'Exclusive 100% combed cotton festive Panjabi with subtle mandarin collar embroidery.',
        },
        aiGenerated: true,
        deliveryStatus: 'SENT',
        createdAt: 'Just now',
      };

      setMessages((prev) => [...prev, botVisionReply, productCardMsg]);
    }, 900);
  };

  const handleSimulateOutOfStockInquiry = async () => {
    const custMsg: MessageItem = {
      id: `query-sz44-${Date.now()}`,
      senderType: 'CUSTOMER',
      content: 'পাঞ্জাবিটার সাইজ ৪৪ কি আছে? আমার সাইজ ৪৪ লাগবে।',
      contentType: 'TEXT',
      deliveryStatus: 'READ',
      createdAt: 'Just now',
    };

    setMessages((prev) => [...prev, custMsg]);

    setTimeout(() => {
      const botReply: MessageItem = {
        id: `bot-sz44-${Date.now()}`,
        senderType: 'BOT',
        content: 'দুঃখিত তানভীর ভাই, আমাদের ডাটাবেজ অনুযায়ী "Royal Navy Blue Embroidered Panjabi"-এর সাইজ ৪৪ বর্তমানে স্টক আউট (০ পিস)। তবে আমাদের সাইজ ৩৮ (১২ পিস), সাইজ ৪০ (১৮ পিস) এবং সাইজ ৪২ (১৫ পিস) স্টকে এভেইলেবল রয়েছে। আপনি চাইলে সাইজ ৪২ নিতে পারেন।',
        contentType: 'TEXT',
        aiGenerated: true,
        tokensUsed: 60,
        deliveryStatus: 'SENT',
        createdAt: 'Just now',
      };

      setMessages((prev) => [...prev, botReply]);
    }, 700);
  };

  const toggleAudioPlayback = (audioId: string) => {
    if (playingAudioId === audioId) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(audioId);
    }
  };

  const handleToggleHandover = async () => {
    const isCurrentlyHuman = activeConv.status === 'HUMAN_HANDOVER';
    const nextStatus = isCurrentlyHuman ? 'BOT_ACTIVE' : 'HUMAN_HANDOVER';

    setConversations((prev) =>
      prev.map((c) => (c.id === activeConv.id ? { ...c, status: nextStatus, aiAssisted: !isCurrentlyHuman } : c))
    );

    const sysMsg: MessageItem = {
      id: `sys-${Date.now()}`,
      senderType: 'SYSTEM',
      content: isCurrentlyHuman
        ? 'AI Assistant reactivated for this conversation.'
        : 'Human agent took over this conversation. AI response paused.',
      contentType: 'TEXT',
      createdAt: 'Just now',
    };
    setMessages((prev) => [...prev, sysMsg]);

    const endpoint = isCurrentlyHuman
      ? `/inbox/conversations/${activeConv.id}/return-to-ai`
      : `/inbox/conversations/${activeConv.id}/takeover`;

    ApiClient.post(endpoint).catch(() => {});
  };

  const handleAssignConversation = (memberId: string | null) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? {
              ...c,
              assignedMemberId: memberId,
              assignedMember: memberId ? { user: { name: 'Support Agent' } } : undefined,
            }
          : c
      )
    );

    ApiClient.patch(`/inbox/conversations/${activeConv.id}/assign`, { memberId }).catch(() => {});
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim();

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          const currentTags = c.customer.tags || [];
          if (!currentTags.includes(tag)) {
            return {
              ...c,
              customer: { ...c.customer, tags: [...currentTags, tag] },
            };
          }
        }
        return c;
      })
    );

    ApiClient.post(`/inbox/customers/${activeConv.customer.id}/tags`, { tag }).catch(() => {});
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            customer: {
              ...c.customer,
              tags: (c.customer.tags || []).filter((t) => t !== tagToRemove),
            },
          };
        }
        return c;
      })
    );

    ApiClient.delete(`/inbox/customers/${activeConv.customer.id}/tags/${encodeURIComponent(tagToRemove)}`).catch(() => {});
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex gap-4 min-w-0">
      {/* ========================================================================= */}
      {/* 1. LEFT PANEL: Filters, Search & Conversation List */}
      {/* ========================================================================= */}
      <div className="w-80 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col shrink-0 overflow-hidden">
        {/* Header & Filter Controls */}
        <div className="p-3.5 border-b border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Omnichannel Inbox</span>
            </h2>
            <Badge variant="indigo" size="sm">
              {filteredConversations.length} Active
            </Badge>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, phone, text..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Channel Filters */}
          <div className="flex gap-1 text-[11px] font-semibold bg-slate-100 p-1 rounded-lg">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'FACEBOOK_PAGE', label: 'FB' },
              { id: 'WHATSAPP_BUSINESS', label: 'WA' },
              { id: 'INSTAGRAM', label: 'IG' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setChannelFilter(tab.id as any)}
                className={`flex-1 py-1 rounded-md transition-colors ${
                  channelFilter === tab.id
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Management & Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-medium pt-0.5">
            <button
              onClick={() => setModeFilter('ALL')}
              className={`px-2 py-0.5 rounded-full border transition-colors whitespace-nowrap ${
                modeFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Chats
            </button>
            <button
              onClick={() => setModeFilter('BOT')}
              className={`px-2 py-0.5 rounded-full border transition-colors whitespace-nowrap flex items-center gap-1 ${
                modeFilter === 'BOT'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bot className="w-2.5 h-2.5" /> AI-Managed
            </button>
            <button
              onClick={() => setModeFilter('HUMAN')}
              className={`px-2 py-0.5 rounded-full border transition-colors whitespace-nowrap flex items-center gap-1 ${
                modeFilter === 'HUMAN'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Headphones className="w-2.5 h-2.5" /> Human Mode
            </button>
            <button
              onClick={() => setModeFilter('UNREAD')}
              className={`px-2 py-0.5 rounded-full border transition-colors whitespace-nowrap ${
                modeFilter === 'UNREAD'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Unread
            </button>
          </div>
        </div>

        {/* Conversation Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No conversations found matching filters.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                    isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
                      {conv.customer.name.slice(0, 2).toUpperCase()}
                    </div>
                    {/* Channel Indicator Badge */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold ${
                        conv.channel.type === 'FACEBOOK_PAGE'
                          ? 'bg-blue-600'
                          : conv.channel.type === 'WHATSAPP_BUSINESS'
                          ? 'bg-emerald-500'
                          : 'bg-pink-500'
                      }`}
                    ></span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-bold text-slate-900 truncate">{conv.customer.name}</p>
                      <span className="text-[10px] text-slate-400">{conv.lastMessageAt}</span>
                    </div>

                    <p className="text-xs text-slate-500 truncate">{conv.lastMessagePreview}</p>

                    <div className="flex items-center gap-1.5 mt-1.5">
                      {conv.status === 'BOT_ACTIVE' ? (
                        <Badge variant="purple" size="sm">
                          <Bot className="w-3 h-3" /> AI
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          <Headphones className="w-3 h-3" /> Human
                        </Badge>
                      )}

                      {conv.assignedMember?.user?.name && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                          • {conv.assignedMember.user.name}
                        </span>
                      )}

                      {conv.unreadCount > 0 && (
                        <span className="ml-auto w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CENTER PANEL: Conversation Timeline, Media & Dual Reply Composer */}
      {/* ========================================================================= */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-w-0 overflow-hidden">
        {/* Chat Feed Header */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
              {activeConv.customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{activeConv.customer.name}</h3>
                <span className="text-xs text-slate-400">({activeConv.customer.phone || 'Social User'})</span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                Channel: <span className="font-semibold text-slate-700">{activeConv.channel.name}</span>
                <span>•</span>
                <span>
                  {activeConv.status === 'BOT_ACTIVE' ? 'Autonomous AI Replying' : 'Human Operator Controlling'}
                </span>
              </p>
            </div>
          </div>

          {/* Handover Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={activeConv.status === 'BOT_ACTIVE' ? 'outline' : 'success'}
              onClick={handleToggleHandover}
              leftIcon={
                activeConv.status === 'BOT_ACTIVE' ? (
                  <Headphones className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <Bot className="w-3.5 h-3.5" />
                )
              }
            >
              {activeConv.status === 'BOT_ACTIVE' ? 'Take Over from AI' : 'Return to AI Assistant'}
            </Button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60">
          {messages.map((msg) => {
            // System Event Note
            if (msg.senderType === 'SYSTEM') {
              return (
                <div key={msg.id} className="text-center my-2">
                  <span className="text-[11px] font-medium bg-slate-200/80 text-slate-700 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {msg.content}
                  </span>
                </div>
              );
            }

            // Internal Private Team Note
            if (msg.isInternal) {
              return (
                <div key={msg.id} className="my-2.5 max-w-lg mx-auto">
                  <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Team Internal Note (Private)
                      </span>
                      <span>{msg.createdAt}</span>
                    </div>
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              );
            }

            const isCustomer = msg.senderType === 'CUSTOMER';
            const isBot = msg.senderType === 'BOT';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isCustomer ? 'justify-start' : 'justify-end'}`}
              >
                {!isCustomer && isBot && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 text-xs shadow-xs order-2">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                {!isCustomer && !isBot && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-white shrink-0 text-xs shadow-xs order-2">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-lg rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isCustomer
                      ? 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                      : isBot
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-slate-800 text-white rounded-br-xs'
                  }`}
                >
                  {/* Media Rendering: Photo */}
                  {msg.contentType === 'IMAGE' && msg.mediaUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-black/10">
                      <img src={msg.mediaUrl} alt="Attached" className="max-h-56 w-full object-cover" />
                    </div>
                  )}

                  {/* Media Rendering: Audio Voice Note (STT Transcribed) */}
                  {msg.contentType === 'AUDIO' && (
                    <div className="mb-2 p-3 rounded-xl bg-slate-900/10 dark:bg-black/20 flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleAudioPlayback(msg.id)}
                          className="w-9 h-9 rounded-full bg-white text-indigo-700 hover:scale-105 flex items-center justify-center shadow-xs transition-transform"
                        >
                          {playingAudioId === msg.id ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4 ml-0.5" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                            <span className="flex items-center gap-1">
                              <Mic className="w-3.5 h-3.5 text-indigo-500" /> Voice Note (Bengali / English)
                            </span>
                            <span className="text-slate-500 font-mono">0:18</span>
                          </div>
                          <div className="w-full bg-slate-300/60 h-2 rounded-full overflow-hidden">
                            <div className={`h-full bg-indigo-600 rounded-full transition-all duration-300 ${playingAudioId === msg.id ? 'w-3/4 animate-pulse' : 'w-1/4'}`}></div>
                          </div>
                        </div>
                      </div>
                      {/* Whisper STT Transcription Card */}
                      <div className="bg-white/90 backdrop-blur-xs rounded-lg p-2 text-xs text-slate-800 border border-indigo-100 shadow-2xs">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 mb-0.5 uppercase tracking-wider">
                          <Sparkles className="w-3 h-3 text-indigo-600" /> Whisper STT Transcription:
                        </div>
                        <p className="italic font-medium">"{msg.content}"</p>
                      </div>
                    </div>
                  )}

                  {/* Media Rendering: Interactive Product Card with Gallery Carousel & Buy Now */}
                  {msg.contentType === 'PRODUCT_CARD' && (
                    <div className="mt-1 bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden text-slate-800">
                      {/* Gallery Images Array Carousel */}
                      {(() => {
                        const metadata = msg.mediaMetadata || {};
                        const images: string[] =
                          metadata.images && metadata.images.length > 0
                            ? metadata.images
                            : [msg.mediaUrl || 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&auto=format&fit=crop'];
                        const curIdx = cardImageIndices[msg.id] || 0;
                        const activeImg = images[curIdx] || images[0];
                        const variants = metadata.variants || [
                          { size: '38', color: 'Navy Blue', stockQuantity: 12 },
                          { size: '40', color: 'Navy Blue', stockQuantity: 18 },
                          { size: '42', color: 'Navy Blue', stockQuantity: 15 },
                          { size: '44', color: 'Navy Blue', stockQuantity: 0 },
                        ];
                        const currentSize = cardSelectedSizes[msg.id] || '42';
                        const price = metadata.price || 2850;
                        const compareAtPrice = metadata.compareAtPrice || 3500;
                        const stockQuantity = metadata.stockQuantity || 45;

                        return (
                          <div className="flex flex-col">
                            {/* Main Carousel Photo */}
                            <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden group">
                              <img
                                src={activeImg}
                                alt={msg.content}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />

                              {images.length > 1 && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCardImageIndices((prev) => ({
                                        ...prev,
                                        [msg.id]: (curIdx - 1 + images.length) % images.length,
                                      }))
                                    }
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-opacity"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCardImageIndices((prev) => ({
                                        ...prev,
                                        [msg.id]: (curIdx + 1) % images.length,
                                      }))
                                    }
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-opacity"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                  <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                    {curIdx + 1} / {images.length} Photos
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Mini Gallery Thumbnails Strip */}
                            {images.length > 1 && (
                              <div className="flex items-center gap-1.5 p-2 bg-slate-50 border-b border-slate-100 overflow-x-auto">
                                {images.map((imgUrl, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() =>
                                      setCardImageIndices((prev) => ({
                                        ...prev,
                                        [msg.id]: idx,
                                      }))
                                    }
                                    className={`w-11 h-11 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                                      curIdx === idx ? 'border-indigo-600 scale-105 shadow-2xs' : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                                  >
                                    <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Card Content & Variant Selector */}
                            <div className="p-3.5 space-y-3">
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-indigo-600" /> AI Matched Product
                                  </span>
                                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    ● In Stock ({stockQuantity} pcs)
                                  </span>
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm leading-snug">{metadata.name || msg.content}</h4>
                                <div className="flex items-baseline gap-2 mt-1">
                                  <span className="text-base font-extrabold text-indigo-700">৳{price.toLocaleString()} BDT</span>
                                  {compareAtPrice && (
                                    <span className="text-xs text-slate-400 line-through">৳{compareAtPrice.toLocaleString()}</span>
                                  )}
                                  {compareAtPrice && (
                                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                      Save ৳{compareAtPrice - price}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Size Pills with Real-Time Stock Indicators */}
                              {variants.length > 0 && (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-slate-600 uppercase tracking-wider">Available Sizes:</span>
                                    <span className="text-slate-400 text-[10px]">(Check stock in DB)</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {variants.map((v: any, idx: number) => {
                                      const stock = v.stockQuantity ?? v.stock ?? 0;
                                      const isOutOfStock = stock <= 0;
                                      const isSelected = currentSize === v.size;
                                      return (
                                        <button
                                          key={idx}
                                          type="button"
                                          disabled={isOutOfStock}
                                          onClick={() =>
                                            setCardSelectedSizes((prev) => ({
                                              ...prev,
                                              [msg.id]: v.size,
                                            }))
                                          }
                                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                                            isSelected
                                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                              : isOutOfStock
                                              ? 'bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed opacity-60'
                                              : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400'
                                          }`}
                                        >
                                          <span>Size {v.size}</span>
                                          {isOutOfStock ? (
                                            <span className="text-[9px] no-underline font-normal text-rose-500">(Stock Out)</span>
                                          ) : (
                                            <span className={`text-[9px] font-normal ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                                              ({stock} left)
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Interactive Buy Now / Order Placement Button */}
                              <Button
                                type="button"
                                onClick={() => handleOpenOrderModal(metadata, currentSize)}
                                variant="primary"
                                size="md"
                                className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 shadow-sm rounded-xl transition-transform active:scale-98"
                                leftIcon={<ShoppingBag className="w-4 h-4" />}
                              >
                                Buy Now / সরাসরি অর্ডার করুন
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Media Rendering: Confirmed Order Card */}
                  {msg.contentType === 'ORDER_CARD' && (
                    <div className="mt-1 bg-emerald-50/90 border border-emerald-200 rounded-xl p-3.5 text-slate-800 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Order Confirmed / অর্ডার নিশ্চিত হয়েছে
                        </span>
                        <Badge variant="success" size="sm">COD Verified</Badge>
                      </div>
                      <div className="text-xs text-slate-700 space-y-1.5 bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs font-sans">
                        <div className="flex justify-between font-mono font-bold text-slate-900 border-b border-slate-100 pb-1">
                          <span>Order Number:</span>
                          <span className="text-indigo-700">{msg.mediaMetadata?.orderNumber || '#ORD-2026-001'}</span>
                        </div>
                        <div className="flex justify-between pt-0.5">
                          <span>Items:</span>
                          <span className="font-semibold text-slate-800">{msg.mediaMetadata?.productName || 'Royal Navy Blue Panjabi'}</span>
                        </div>
                        {msg.mediaMetadata?.size && (
                          <div className="flex justify-between">
                            <span>Size & Color:</span>
                            <span className="font-semibold text-slate-800">Size {msg.mediaMetadata.size} | {msg.mediaMetadata.color || 'Navy Blue'}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Payment Method:</span>
                          <span className="font-semibold text-slate-800">Cash on Delivery (COD)</span>
                        </div>
                        <div className="flex justify-between text-emerald-800 font-bold border-t border-slate-100 pt-1">
                          <span>Total Payable:</span>
                          <span>৳{(msg.mediaMetadata?.totalAmount || 2910).toLocaleString()} BDT</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
                          <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Delivery via Steadfast Express (24-48 Hours)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Standard Text Body */}
                  {msg.contentType !== 'PRODUCT_CARD' && msg.contentType !== 'ORDER_CARD' && (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}

                  {/* Voice Reply Player Option for AI Bot Responses */}
                  {isBot && msg.voiceReplyUrl && (
                    <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleAudioPlayback(`voice-reply-${msg.id}`)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-100 hover:text-white bg-black/20 hover:bg-black/30 px-2.5 py-1 rounded-full transition-colors"
                      >
                        {playingAudioId === `voice-reply-${msg.id}` ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-rose-300" />
                            <span>Stop Voice Reply</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-sky-200" />
                            <span>🔊 AI Voice Reply (Nova - TTS)</span>
                          </>
                        )}
                      </button>
                      <span className="text-[10px] text-indigo-200">Bangla & English</span>
                    </div>
                  )}

                  {/* Delivery State & Timestamp Footer */}
                  <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] opacity-75">
                    {isBot && <span>AI Generated • </span>}
                    <span>{msg.createdAt}</span>
                    {!isCustomer && (
                      <span>
                        {msg.deliveryStatus === 'READ' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                        ) : msg.deliveryStatus === 'DELIVERED' ? (
                          <CheckCheck className="w-3.5 h-3.5" />
                        ) : msg.deliveryStatus === 'FAILED' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Canned Responses & Real-Time AI Simulation Tray */}
        <div className="px-3.5 py-2 bg-slate-100/80 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-bold px-1 whitespace-nowrap uppercase tracking-wider text-[10px]">AI Actions:</span>
          
          <button
            type="button"
            onClick={handleSimulateVoiceNote}
            className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold whitespace-nowrap transition-colors flex items-center gap-1 shadow-2xs"
          >
            <Mic className="w-3.5 h-3.5 text-indigo-600" /> 🎙️ Voice Note Demo
          </button>

          <button
            type="button"
            onClick={handleSimulateImageSearch}
            className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 font-semibold whitespace-nowrap transition-colors flex items-center gap-1 shadow-2xs"
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-600" /> 📷 Vision Match Demo
          </button>

          <button
            type="button"
            onClick={handleSimulateOutOfStockInquiry}
            className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-semibold whitespace-nowrap transition-colors flex items-center gap-1 shadow-2xs"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> ❌ Size 44 Out-of-Stock Demo
          </button>

          <span className="text-slate-300">|</span>

          <button
            type="button"
            onClick={() => setReplyText('ঢাকার ভেতরে ডেলিভারি চার্জ ৬০ টাকা (২৪-৪৮ ঘণ্টার মধ্যে), ঢাকার বাইরে ১২০ টাকা।')}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 whitespace-nowrap transition-colors"
          >
            🚚 Delivery Charges
          </button>
          <button
            type="button"
            onClick={() => setReplyText('আমাদের পাঞ্জাবি সাইজ ৩৮ (চেস্ট ৪০ ইঞ্চি), সাইজ ৪০ (চেস্ট ৪২ ইঞ্চি), সাইজ ৪২ (চেস্ট ৪৪ ইঞ্চি)।')}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 whitespace-nowrap transition-colors"
          >
            📏 Size Guide
          </button>
        </div>

        {/* Dual Mode Reply Composer */}
        <div className="p-3 bg-white border-t border-slate-100 space-y-2">
          {/* Mode Switcher: Customer Reply vs Internal Note */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setIsInternalNote(false)}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                  !isInternalNote ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Reply to Customer</span>
              </button>
              <button
                type="button"
                onClick={() => setIsInternalNote(true)}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                  isInternalNote ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Internal Note</span>
              </button>
            </div>

            {mediaAttachmentUrl && (
              <span className="text-[11px] text-indigo-600 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Media attached
                <button onClick={() => setMediaAttachmentUrl('')} className="ml-1 text-slate-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button
              type="button"
              title="Attach Product Photo"
              onClick={() => {
                const url = prompt(
                  'Enter Image URL to attach:',
                  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80'
                );
                if (url) setMediaAttachmentUrl(url);
              }}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={
                isInternalNote
                  ? 'Write an internal team note (only visible to agents)...'
                  : activeConv.status === 'BOT_ACTIVE'
                  ? 'AI is active. Type here to reply manually and pause bot...'
                  : 'Type message to send to customer on ' + activeConv.channel.name + '...'
              }
              className={`flex-1 border rounded-xl px-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 ${
                isInternalNote
                  ? 'bg-amber-50/50 border-amber-300 text-amber-950 focus:ring-amber-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-600'
              }`}
            />

            <Button
              type="submit"
              size="md"
              disabled={!replyText.trim() && !mediaAttachmentUrl}
              isLoading={isSending}
              variant={isInternalNote ? 'secondary' : 'primary'}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RIGHT PANEL: Customer Details, Tags, AI Summary, Orders, Assignment */}
      {/* ========================================================================= */}
      <div className="w-80 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col shrink-0 overflow-y-auto divide-y divide-slate-100">
        {/* Customer Details */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Customer Details</h3>
            <Badge variant="success">Active</Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              {activeConv.customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{activeConv.customer.name}</h4>
              <p className="text-xs text-slate-500">{activeConv.customer.phone || 'No phone'}</p>
            </div>
          </div>

          <div className="space-y-1 text-xs text-slate-600 pt-1">
            <div className="flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{activeConv.customer.address || 'Address not captured'}, {activeConv.customer.city || 'Dhaka'}</span>
            </div>
          </div>
        </div>

        {/* Customer Tags */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Customer Tags</span>
            </h3>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(activeConv.customer.tags || []).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="Add tag (e.g. VIP, Wholesale)..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
            <Button size="sm" variant="outline" onClick={handleAddTag}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* AI Conversation Summary */}
        <div className="p-4 space-y-2.5 bg-indigo-50/30">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Conversation Summary</span>
            </h3>
            <Badge variant="success" size="sm">
              {aiSummary.sentiment}
            </Badge>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
            {aiSummary.summary}
          </p>

          <div className="space-y-1 text-[11px] text-slate-600">
            {aiSummary.keyPoints.map((pt, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment Controls */}
        <div className="p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Agent Assignment</span>
          </h3>

          <select
            value={activeConv.assignedMemberId || ''}
            onChange={(e) => handleAssignConversation(e.target.value || null)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-600"
          >
            <option value="">Unassigned</option>
            <option value="mem-1">Support Agent (You)</option>
            <option value="mem-2">Sales Specialist</option>
            <option value="mem-3">Operations Manager</option>
          </select>
        </div>

        {/* Purchase History & Orders */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Purchase History</span>
            </h3>
            <span className="text-xs font-bold text-slate-900">
              ৳{activeConv.customer.totalSpent.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">#ORD-2026-001</span>
                <Badge variant="success" size="sm">Delivered</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Royal Navy Blue Panjabi (42)</p>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 pt-0.5">
                <span>Steadfast COD</span>
                <span>৳2,910 BDT</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: Quick Order Placement / সরাসরি অর্ডার কনফার্মেশন */}
      {/* ========================================================================= */}
      {isOrderModalOpen && orderProduct && (
        <Modal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          title="Quick Order Placement / অর্ডার নিশ্চিত করুন"
        >
          <form onSubmit={handleConfirmOrder} className="space-y-4">
            {/* Product Summary Banner */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <img
                src={orderProduct.images?.[0] || 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=200'}
                alt={orderProduct.name}
                className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{orderProduct.name}</h4>
                <div className="flex items-center gap-2 mt-0.5 text-xs">
                  <span className="font-bold text-indigo-700">৳{Number(orderProduct.price).toLocaleString()} BDT</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-medium text-slate-600">Selected Size: <strong className="text-indigo-600">{orderSize}</strong></span>
                </div>
              </div>
            </div>

            {/* Size & Quantity Selector in Modal */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Confirm Size:</label>
                <select
                  value={orderSize}
                  onChange={(e) => setOrderSize(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="38">Size 38 (12 in stock)</option>
                  <option value="40">Size 40 (18 in stock)</option>
                  <option value="42">Size 42 (15 in stock)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Quantity / পরিমাণ:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-slate-900">{orderQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setOrderQuantity(orderQuantity + 1)}
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer Full Name / গ্রাহকের নাম: *</label>
                <Input
                  value={orderCustomerName}
                  onChange={(e) => setOrderCustomerName(e.target.value)}
                  required
                  placeholder="e.g. Tanvir Ahmed"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Phone Number / মোবাইল নম্বর: *</label>
                <Input
                  value={orderCustomerPhone}
                  onChange={(e) => setOrderCustomerPhone(e.target.value)}
                  required
                  placeholder="e.g. +880 1712-345678"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Delivery Full Address / পূর্ণ ঠিকানা: *</label>
                <textarea
                  value={orderCustomerAddress}
                  onChange={(e) => setOrderCustomerAddress(e.target.value)}
                  required
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  placeholder="House, Road, Area, City..."
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Delivery Destination / ডেলিভারি এরিয়া:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryArea('INSIDE_DHAKA')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      deliveryArea === 'INSIDE_DHAKA'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-2xs font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Inside Dhaka</span>
                      <span className="text-indigo-600">৳60</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">24 - 48 Hours Delivery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryArea('OUTSIDE_DHAKA')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      deliveryArea === 'OUTSIDE_DHAKA'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-2xs font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Outside Dhaka</span>
                      <span className="text-indigo-600">৳120</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">48 - 72 Hours Delivery</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({orderQuantity} pcs):</span>
                <span>৳{(orderProduct.price * orderQuantity).toLocaleString()} BDT</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge ({deliveryArea === 'INSIDE_DHAKA' ? 'Inside Dhaka' : 'Outside Dhaka'}):</span>
                <span>৳{deliveryArea === 'INSIDE_DHAKA' ? '60' : '120'} BDT</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-1.5">
                <span>Total Payable (Cash on Delivery):</span>
                <span className="text-emerald-700">
                  ৳{((orderProduct.price * orderQuantity) + (deliveryArea === 'INSIDE_DHAKA' ? 60 : 120)).toLocaleString()} BDT
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsOrderModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmittingOrder}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm Order / অর্ডার নিশ্চিত করুন
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Floating Order Success Toast */}
      {orderSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{orderSuccessToast}</span>
        </div>
      )}
    </div>
  );
}
