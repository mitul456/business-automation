import {
  WorkspaceRole,
  TenantStatus,
  ChannelType,
  ConversationStatus,
  MessageContentType,
  SenderType,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  CourierProvider,
} from '../enums';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId?: string;
  role?: WorkspaceRole;
  isSuperAdmin?: boolean;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  isSuperAdmin: boolean;
  tenantId?: string;
  role?: WorkspaceRole;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface WsMessageEvent {
  conversationId: string;
  tenantId: string;
  message: {
    id: string;
    senderType: SenderType;
    senderId?: string | null;
    content: string;
    contentType: MessageContentType;
    mediaUrl?: string | null;
    createdAt: string;
    aiGenerated?: boolean;
  };
}

export interface WsConversationUpdateEvent {
  conversationId: string;
  tenantId: string;
  status: ConversationStatus;
  unreadCount: number;
  lastMessagePreview?: string | null;
  lastMessageAt: string;
  assignedMemberId?: string | null;
}

export interface ShippingAddressDto {
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  district?: string;
  postalCode?: string;
  notes?: string;
}

export interface AiAgentCapabilities {
  autoOrderCreation: boolean;
  productSearch: boolean;
  imageRecognition: boolean;
  voiceTranscription: boolean;
  bookingAppointment: boolean;
  sentimentAnalysis: boolean;
}
