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
  LeadStage,
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
  category: z.string().default('GENERAL_RETAIL'),
  country: z.string().default('BD'),
  currency: z.string().default('BDT'),
  timezone: z.string().default('Asia/Dhaka'),
  defaultLanguage: z.enum(['en', 'bn']).default('bn'),
  businessSettings: z.record(z.any()).optional(),
});
export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  defaultLanguage: z.enum(['en', 'bn']).optional(),
  businessSettings: z.record(z.any()).optional(),
});
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>;

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

export const ResendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const GoogleAuthSchema = z.object({
  credential: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  googleId: z.string().optional(),
  avatarUrl: z.string().optional(),
});
export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

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
  isInternal: z.boolean().default(false).optional(),
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
  businessIdentity: z.string().optional(),
  personality: z.string().optional(),
  escalationRules: z.record(z.any()).optional(),
  knowledgeSourceIds: z.array(z.string()).optional(),
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
  lowStockThreshold: z.number().int().nonnegative().default(5).optional(),
  images: z.array(z.string()).default([]),
  visualTags: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        size: z.string().optional(),
        color: z.string().optional(),
        sku: z.string().optional(),
        price: z.number().positive().optional(),
        stockQuantity: z.number().int().nonnegative().default(0),
      })
    )
    .optional(),
});
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const AdjustInventorySchema = z.object({
  quantityDelta: z.number().int(),
  type: z.enum(['RESTOCK', 'DAMAGE_LOSS', 'MANUAL_CORRECTION', 'ORDER_DEDUCTION', 'ORDER_CANCEL_RESTORE']),
  notes: z.string().optional(),
  referenceId: z.string().optional(),
});
export type AdjustInventoryInput = z.infer<typeof AdjustInventorySchema>;

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  avatarUrl: z.string().url().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  leadStage: z.nativeEnum(LeadStage).default(LeadStage.NEW),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

export const UpdateCustomerSchema = CreateCustomerSchema.partial();
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;

export const CreateFollowUpSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().min(1),
  dueDate: z.string().min(1),
  notes: z.string().optional(),
  assignedMemberId: z.string().optional(),
});
export type CreateFollowUpInput = z.infer<typeof CreateFollowUpSchema>;

export const UpdateFollowUpSchema = z.object({
  isCompleted: z.boolean().optional(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
});
export type UpdateFollowUpInput = z.infer<typeof UpdateFollowUpSchema>;

export const CancelOrderSchema = z.object({
  reason: z.string().optional(),
});
export type CancelOrderInput = z.infer<typeof CancelOrderSchema>;

export const UpdatePaymentStatusSchema = z.object({
  paymentStatus: z.nativeEnum(PaymentStatus),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
});
export type UpdatePaymentStatusInput = z.infer<typeof UpdatePaymentStatusSchema>;

export const CreateBookingServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive().default(30),
  price: z.number().nonnegative().default(0),
});
export type CreateBookingServiceInput = z.infer<typeof CreateBookingServiceSchema>;

export const CreateBookingAppointmentSchema = z.object({
  serviceId: z.string().min(1),
  customerId: z.string().min(1),
  conversationId: z.string().optional(),
  scheduledStartTime: z.string().min(1),
  scheduledEndTime: z.string().min(1),
  customerNotes: z.string().optional(),
});
export type CreateBookingAppointmentInput = z.infer<typeof CreateBookingAppointmentSchema>;

export const RescheduleAppointmentSchema = z.object({
  scheduledStartTime: z.string().min(1),
  scheduledEndTime: z.string().min(1),
});
export type RescheduleAppointmentInput = z.infer<typeof RescheduleAppointmentSchema>;

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
  graphJson: z.any().optional(),
  isActive: z.boolean().default(true),
  steps: z.array(z.object({
    stepOrder: z.number().int().nonnegative(),
    actionType: z.nativeEnum(WorkflowActionType),
    actionConfig: z.record(z.any()),
  })).min(1),
});
export type WorkflowInput = z.infer<typeof WorkflowSchema>;

export * from './env.schema';

