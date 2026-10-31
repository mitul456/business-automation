import { z } from 'zod';
import {
  WorkspaceRole,
  ChannelType,
  AiTone,
  AiLanguage,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  CourierProvider,
  PaymentProvider,
  WorkflowTriggerType,
  WorkflowActionType,
} from '../enums';

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  workspaceName: z.string().min(2, 'Workspace name must be at least 2 characters').optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const CreateTenantSchema = z.object({
  name: z.string().min(2, 'Tenant name must be at least 2 characters'),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric with hyphens'),
  currency: z.string().default('BDT'),
  timezone: z.string().default('Asia/Dhaka'),
  defaultLanguage: z.enum(['en', 'bn']).default('bn'),
});
export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(WorkspaceRole).default(WorkspaceRole.AGENT),
});
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;

export const ConnectChannelSchema = z.object({
  type: z.nativeEnum(ChannelType),
  name: z.string().min(1),
  externalId: z.string().min(1),
  accessToken: z.string().min(1),
  config: z.record(z.any()).optional(),
});
export type ConnectChannelInput = z.infer<typeof ConnectChannelSchema>;

export const SendMessageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1, 'Message content cannot be empty'),
  contentType: z.enum(['TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'FILE', 'PRODUCT_CARD', 'ORDER_CARD']).default('TEXT'),
  mediaUrl: z.string().url().optional(),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export const AiAgentConfigSchema = z.object({
  personaName: z.string().min(1).default('OmniAssistant'),
  systemPrompt: z.string().min(10),
  tone: z.nativeEnum(AiTone).default(AiTone.FRIENDLY),
  language: z.nativeEnum(AiLanguage).default(AiLanguage.AUTO),
  temperature: z.number().min(0).max(2).default(0.7),
  confidenceThreshold: z.number().min(0).max(1).default(0.75),
  capabilities: z.object({
    autoOrderCreation: z.boolean().default(true),
    productSearch: z.boolean().default(true),
    imageRecognition: z.boolean().default(true),
    voiceTranscription: z.boolean().default(true),
    bookingAppointment: z.boolean().default(true),
    sentimentAnalysis: z.boolean().default(true),
  }),
  handoverKeywords: z.array(z.string()).default(['কথা বলতে চাই', 'agent', 'human', 'support', 'man']),
  fallbackMessageEn: z.string().default('I am connecting you with one of our human team members. Please wait a moment!'),
  fallbackMessageBn: z.string().default('আমি আপনাকে আমাদের একজন প্রতিনিধি সাথে সংযুক্ত করছি। একটু অপেক্ষা করুন!'),
  businessHoursOnly: z.boolean().default(false),
  businessHoursJson: z.record(z.any()).optional(),
});
export type AiAgentConfigInput = z.infer<typeof AiAgentConfigSchema>;

export const CreateProductSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  stockQuantity: z.number().int().nonnegative().default(0),
  images: z.array(z.string()).default([]),
  visualTags: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
});
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const CreateOrderSchema = z.object({
  customerId: z.string().min(1),
  conversationId: z.string().optional(),
  channelId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    productName: z.string(),
    unitPrice: z.number().positive(),
    quantity: z.number().int().positive(),
  })).min(1, 'Order must contain at least one item'),
  shippingCost: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.COD),
  shippingAddress: z.object({
    recipientName: z.string().min(1),
    phone: z.string().min(6),
    address: z.string().min(3),
    city: z.string().min(1),
    district: z.string().optional(),
    postalCode: z.string().optional(),
    notes: z.string().optional(),
  }),
  notes: z.string().optional(),
  idempotencyKey: z.string().optional(),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  courierName: z.string().optional(),
  courierTrackingId: z.string().optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

export const CourierSettingSchema = z.object({
  provider: z.nativeEnum(CourierProvider),
  apiKey: z.string().min(1),
  secretKey: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});
export type CourierSettingInput = z.infer<typeof CourierSettingSchema>;

export const PaymentIntegrationSchema = z.object({
  provider: z.nativeEnum(PaymentProvider),
  merchantId: z.string().optional(),
  apiKey: z.string().min(1),
  secretKey: z.string().min(1),
  isSandbox: z.boolean().default(true),
  isActive: z.boolean().default(true),
});
export type PaymentIntegrationInput = z.infer<typeof PaymentIntegrationSchema>;

export const WorkflowSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  triggerType: z.nativeEnum(WorkflowTriggerType),
  triggerConfig: z.record(z.any()).default({}),
  isActive: z.boolean().default(true),
  steps: z.array(z.object({
    stepOrder: z.number().int().nonnegative(),
    actionType: z.nativeEnum(WorkflowActionType),
    actionConfig: z.record(z.any()),
  })).min(1),
});
export type WorkflowInput = z.infer<typeof WorkflowSchema>;
