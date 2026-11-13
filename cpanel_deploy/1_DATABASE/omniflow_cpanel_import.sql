-- CreateTable
CREATE TABLE `Tenant` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `logo` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'GENERAL_RETAIL',
    `country` VARCHAR(191) NOT NULL DEFAULT 'BD',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Dhaka',
    `defaultLanguage` VARCHAR(191) NOT NULL DEFAULT 'bn',
    `creditBalance` INTEGER NOT NULL DEFAULT 500,
    `lowCreditThreshold` INTEGER NOT NULL DEFAULT 100,
    `monthlyUsageLimit` INTEGER NULL,
    `businessSettings` JSON NULL,
    `status` ENUM('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED') NOT NULL DEFAULT 'TRIAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Tenant_slug_key`(`slug`),
    INDEX `Tenant_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `isSuperAdmin` BOOLEAN NOT NULL DEFAULT false,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `emailVerificationToken` VARCHAR(191) NULL,
    `emailVerificationExpiresAt` DATETIME(3) NULL,
    `passwordResetToken` VARCHAR(191) NULL,
    `passwordResetExpiresAt` DATETIME(3) NULL,
    `googleId` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'INVITED') NOT NULL DEFAULT 'ACTIVE',
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `deviceInfo` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `revoked` BOOLEAN NOT NULL DEFAULT false,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserSession_tokenHash_key`(`tokenHash`),
    INDEX `UserSession_userId_idx`(`userId`),
    INDEX `UserSession_tokenHash_idx`(`tokenHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkspaceMember` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'MANAGER', 'SALES_AGENT', 'SUPPORT_AGENT', 'VIEWER', 'AGENT') NOT NULL DEFAULT 'AGENT',
    `isOnline` BOOLEAN NOT NULL DEFAULT false,
    `activeConversationCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WorkspaceMember_tenantId_idx`(`tenantId`),
    INDEX `WorkspaceMember_userId_idx`(`userId`),
    UNIQUE INDEX `WorkspaceMember_tenantId_userId_key`(`tenantId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TenantSubscription` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `planTier` ENUM('STARTER', 'GROWTH', 'PRO', 'ENTERPRISE') NOT NULL DEFAULT 'STARTER',
    `billingCycle` ENUM('MONTHLY', 'YEARLY') NOT NULL DEFAULT 'MONTHLY',
    `status` ENUM('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `currentPeriodStart` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `currentPeriodEnd` DATETIME(3) NOT NULL,
    `stripeSubscriptionId` VARCHAR(191) NULL,
    `bkashSubscriptionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TenantSubscription_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiCreditTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `type` ENUM('SUBSCRIPTION_GRANT', 'TOPUP_PURCHASE', 'BONUS', 'USAGE_CHAT', 'USAGE_VISION', 'USAGE_VOICE', 'USAGE_EMBEDDING', 'REFUND', 'ADMIN_ADJUSTMENT', 'TRIAL_GRANT') NOT NULL,
    `balanceAfter` INTEGER NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `idempotencyKey` VARCHAR(191) NULL,
    `adminUserId` VARCHAR(191) NULL,
    `orderId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AiCreditTransaction_idempotencyKey_key`(`idempotencyKey`),
    INDEX `AiCreditTransaction_tenantId_createdAt_idx`(`tenantId`, `createdAt`),
    INDEX `AiCreditTransaction_idempotencyKey_idx`(`idempotencyKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiUsageLog` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL DEFAULT 'OPENAI',
    `model` VARCHAR(191) NOT NULL,
    `operation` VARCHAR(191) NOT NULL,
    `inputTokens` INTEGER NOT NULL DEFAULT 0,
    `outputTokens` INTEGER NOT NULL DEFAULT 0,
    `totalTokens` INTEGER NOT NULL DEFAULT 0,
    `providerCostUsd` DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    `providerCostBdt` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `creditsDeducted` INTEGER NOT NULL DEFAULT 1,
    `customerChargeBdt` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `idempotencyKey` VARCHAR(191) NULL,
    `conversationId` VARCHAR(191) NULL,
    `messageId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AiUsageLog_idempotencyKey_key`(`idempotencyKey`),
    INDEX `AiUsageLog_tenantId_createdAt_idx`(`tenantId`, `createdAt`),
    INDEX `AiUsageLog_provider_createdAt_idx`(`provider`, `createdAt`),
    INDEX `AiUsageLog_operation_idx`(`operation`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlatformSetting` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `description` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `PlatformSetting_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `details` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_tenantId_createdAt_idx`(`tenantId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Channel` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `type` ENUM('FACEBOOK_PAGE', 'INSTAGRAM', 'WHATSAPP_BUSINESS', 'LIVECHAT') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `accessTokenEncrypted` TEXT NULL,
    `refreshTokenEncrypted` TEXT NULL,
    `webhookVerifyToken` VARCHAR(191) NULL,
    `status` ENUM('CONNECTED', 'DISCONNECTED', 'EXPIRED', 'ERROR') NOT NULL DEFAULT 'CONNECTED',
    `config` JSON NULL,
    `lastSyncedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Channel_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `Channel_tenantId_type_externalId_key`(`tenantId`, `type`, `externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `district` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `leadStage` ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST') NOT NULL DEFAULT 'NEW',
    `leadScore` INTEGER NOT NULL DEFAULT 50,
    `assignedMemberId` VARCHAR(191) NULL,
    `tags` JSON NULL,
    `notes` TEXT NULL,
    `totalOrders` INTEGER NOT NULL DEFAULT 0,
    `totalSpent` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Customer_tenantId_phone_idx`(`tenantId`, `phone`),
    INDEX `Customer_tenantId_email_idx`(`tenantId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Conversation` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `assignedMemberId` VARCHAR(191) NULL,
    `status` ENUM('OPEN', 'BOT_ACTIVE', 'HUMAN_HANDOVER', 'SNOOZED', 'RESOLVED') NOT NULL DEFAULT 'BOT_ACTIVE',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `lastMessagePreview` TEXT NULL,
    `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `unreadCount` INTEGER NOT NULL DEFAULT 0,
    `aiAssisted` BOOLEAN NOT NULL DEFAULT true,
    `tags` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Conversation_tenantId_status_idx`(`tenantId`, `status`),
    INDEX `Conversation_tenantId_lastMessageAt_idx`(`tenantId`, `lastMessageAt`),
    INDEX `Conversation_channelId_idx`(`channelId`),
    INDEX `Conversation_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `senderType` ENUM('CUSTOMER', 'AGENT', 'BOT', 'SYSTEM') NOT NULL,
    `senderId` VARCHAR(191) NULL,
    `contentType` ENUM('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'FILE', 'PRODUCT_CARD', 'ORDER_CARD', 'TEMPLATE') NOT NULL DEFAULT 'TEXT',
    `content` TEXT NOT NULL,
    `mediaUrl` TEXT NULL,
    `mediaMetadata` JSON NULL,
    `externalMessageId` VARCHAR(191) NULL,
    `deliveryStatus` ENUM('SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED') NOT NULL DEFAULT 'SENT',
    `aiGenerated` BOOLEAN NOT NULL DEFAULT false,
    `isInternal` BOOLEAN NOT NULL DEFAULT false,
    `tokensUsed` INTEGER NULL,
    `sentiment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Message_tenantId_idx`(`tenantId`),
    INDEX `Message_conversationId_createdAt_idx`(`conversationId`, `createdAt`),
    INDEX `Message_externalMessageId_idx`(`externalMessageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiAgentConfig` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `personaName` VARCHAR(191) NOT NULL DEFAULT 'OmniAssistant',
    `systemPrompt` TEXT NOT NULL,
    `tone` ENUM('FRIENDLY', 'PROFESSIONAL', 'DIRECT', 'PERSUASIVE') NOT NULL DEFAULT 'FRIENDLY',
    `language` ENUM('AUTO', 'BENGALI', 'ENGLISH', 'BANGLISH') NOT NULL DEFAULT 'AUTO',
    `temperature` DOUBLE NOT NULL DEFAULT 0.7,
    `confidenceThreshold` DOUBLE NOT NULL DEFAULT 0.75,
    `capabilities` JSON NOT NULL,
    `handoverKeywords` JSON NOT NULL,
    `fallbackMessageEn` TEXT NOT NULL,
    `fallbackMessageBn` TEXT NOT NULL,
    `businessHoursOnly` BOOLEAN NOT NULL DEFAULT false,
    `businessHoursJson` JSON NULL,
    `businessIdentity` TEXT NULL,
    `personality` VARCHAR(191) NULL DEFAULT 'Helpful, polite and sales-oriented',
    `escalationRules` JSON NULL,
    `knowledgeSourceIds` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AiAgentConfig_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeBase` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `KnowledgeBase_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeDocument` (
    `id` VARCHAR(191) NOT NULL,
    `knowledgeBaseId` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `sourceType` ENUM('FAQ', 'MANUAL_TEXT', 'PDF_FILE', 'DOCX_FILE', 'TXT_FILE', 'CSV_FILE', 'URL_SCRAPE', 'INSTRUCTIONS') NOT NULL DEFAULT 'FAQ',
    `sourceUrl` TEXT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'INDEXED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `chunkCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `KnowledgeDocument_knowledgeBaseId_idx`(`knowledgeBaseId`),
    INDEX `KnowledgeDocument_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeChunk` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `embedding` JSON NOT NULL,
    `metadata` JSON NULL,
    `tokenCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `KnowledgeChunk_documentId_idx`(`documentId`),
    INDEX `KnowledgeChunk_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_tenantId_slug_key`(`tenantId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `compareAtPrice` DECIMAL(12, 2) NULL,
    `costPrice` DECIMAL(12, 2) NULL,
    `stockQuantity` INTEGER NOT NULL DEFAULT 0,
    `lowStockThreshold` INTEGER NOT NULL DEFAULT 5,
    `variants` JSON NULL,
    `images` JSON NOT NULL,
    `visualTags` JSON NULL,
    `status` ENUM('ACTIVE', 'DRAFT', 'OUT_OF_STOCK', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Product_tenantId_status_idx`(`tenantId`, `status`),
    UNIQUE INDEX `Product_tenantId_sku_key`(`tenantId`, `sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NULL,
    `channelId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `shippingCost` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `totalAmount` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `paymentStatus` ENUM('UNPAID', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'REFUNDED', 'FAILED', 'REJECTED') NOT NULL DEFAULT 'UNPAID',
    `paymentMethod` ENUM('COD', 'BKASH', 'NAGAD', 'STRIPE', 'SSLCOMMERZ') NOT NULL DEFAULT 'COD',
    `shippingAddress` JSON NOT NULL,
    `notes` TEXT NULL,
    `idempotencyKey` VARCHAR(191) NULL,
    `courierName` VARCHAR(191) NULL,
    `courierTrackingId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_idempotencyKey_key`(`idempotencyKey`),
    INDEX `Order_tenantId_status_idx`(`tenantId`, `status`),
    INDEX `Order_customerId_idx`(`customerId`),
    UNIQUE INDEX `Order_tenantId_orderNumber_key`(`tenantId`, `orderNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `productName` VARCHAR(191) NOT NULL,
    `unitPrice` DECIMAL(12, 2) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `totalPrice` DECIMAL(12, 2) NOT NULL,

    INDEX `OrderItem_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourierSetting` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `provider` ENUM('STEADFAST', 'PATHAO', 'REDX', 'MANUAL') NOT NULL,
    `apiKeyEncrypted` TEXT NOT NULL,
    `secretKeyEncrypted` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CourierSetting_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Shipment` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `courier` ENUM('STEADFAST', 'PATHAO', 'REDX', 'MANUAL') NOT NULL,
    `consignmentId` VARCHAR(191) NULL,
    `trackingCode` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `pickupAddress` JSON NULL,
    `deliveryFee` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `codAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `rawResponse` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Shipment_tenantId_idx`(`tenantId`),
    INDEX `Shipment_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentIntegration` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `provider` ENUM('BKASH', 'NAGAD', 'STRIPE', 'SSLCOMMERZ', 'MANUAL') NOT NULL,
    `merchantId` VARCHAR(191) NULL,
    `apiKeyEncrypted` TEXT NOT NULL,
    `secretKeyEncrypted` TEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isSandbox` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PaymentIntegration_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `provider` ENUM('BKASH', 'NAGAD', 'STRIPE', 'SSLCOMMERZ', 'MANUAL') NOT NULL,
    `transactionId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `status` ENUM('UNPAID', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'REFUNDED', 'FAILED', 'REJECTED') NOT NULL DEFAULT 'UNPAID',
    `providerResponse` JSON NULL,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PaymentTransaction_tenantId_idx`(`tenantId`),
    INDEX `PaymentTransaction_orderId_idx`(`orderId`),
    INDEX `PaymentTransaction_transactionId_idx`(`transactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Workflow` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `triggerType` ENUM('NEW_MESSAGE', 'NEW_CUSTOMER', 'NEW_LEAD', 'ORDER_CREATED', 'ORDER_STATUS_CHANGED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'PAYMENT_RECEIVED', 'BOOKING_CREATED', 'INACTIVITY_TIMEOUT', 'KEYWORD_DETECTED', 'HUMAN_HANDOVER_REQUESTED') NOT NULL,
    `triggerConfig` JSON NOT NULL,
    `graphJson` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Workflow_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkflowExecution` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `workflowId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'SUCCESS',
    `triggerEvent` VARCHAR(191) NOT NULL,
    `contextData` JSON NULL,
    `stepResults` JSON NULL,
    `errorMessage` TEXT NULL,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    INDEX `WorkflowExecution_tenantId_workflowId_startedAt_idx`(`tenantId`, `workflowId`, `startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkflowStep` (
    `id` VARCHAR(191) NOT NULL,
    `workflowId` VARCHAR(191) NOT NULL,
    `stepOrder` INTEGER NOT NULL,
    `actionType` ENUM('SEND_MESSAGE', 'ASSIGN_AGENT', 'ADD_CUSTOMER_TAG', 'CREATE_LEAD', 'CREATE_ORDER_DRAFT', 'SEND_NOTIFICATION', 'SCHEDULE_FOLLOWUP', 'ESCALATE_TO_HUMAN', 'AI_GENERATE_REPLY', 'UPDATE_LEAD_STAGE', 'DISPATCH_COURIER_PARCEL', 'TRIGGER_WEBHOOK', 'WAIT_DELAY') NOT NULL,
    `actionConfig` JSON NOT NULL,

    INDEX `WorkflowStep_workflowId_idx`(`workflowId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BookingService` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `durationMinutes` INTEGER NOT NULL DEFAULT 30,
    `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BookingService_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BookingAppointment` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NULL,
    `scheduledStartTime` DATETIME(3) NOT NULL,
    `scheduledEndTime` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'PENDING',
    `customerNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BookingAppointment_tenantId_scheduledStartTime_idx`(`tenantId`, `scheduledStartTime`),
    INDEX `BookingAppointment_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantityDelta` INTEGER NOT NULL,
    `balanceAfter` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `referenceId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InventoryTransaction_tenantId_productId_idx`(`tenantId`, `productId`),
    INDEX `InventoryTransaction_tenantId_createdAt_idx`(`tenantId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FollowUp` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `assignedMemberId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FollowUp_tenantId_dueDate_idx`(`tenantId`, `dueDate`),
    INDEX `FollowUp_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomerTimelineEvent` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CustomerTimelineEvent_tenantId_customerId_createdAt_idx`(`tenantId`, `customerId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CreditTopupRequest` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `credits` INTEGER NOT NULL,
    `amountBdt` DECIMAL(12, 2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL,
    `status` ENUM('UNPAID', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'REFUNDED', 'FAILED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `trxId` VARCHAR(191) NULL,
    `customerPhone` VARCHAR(191) NULL,
    `providerRef` VARCHAR(191) NULL,
    `adminNotes` TEXT NULL,
    `approvedAt` DATETIME(3) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CreditTopupRequest_tenantId_createdAt_idx`(`tenantId`, `createdAt`),
    INDEX `CreditTopupRequest_status_idx`(`status`),
    INDEX `CreditTopupRequest_trxId_idx`(`trxId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentMethodConfig` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'AUTOMATED',
    `merchantNumber` VARCHAR(191) NULL,
    `instructions` TEXT NULL,
    `apiKeyEncrypted` TEXT NULL,
    `secretEncrypted` TEXT NULL,
    `webhookSecret` TEXT NULL,
    `logoUrl` VARCHAR(191) NULL,
    `minAmount` DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
    `maxAmount` DECIMAL(10, 2) NOT NULL DEFAULT 100000.00,
    `isSandbox` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentMethodConfig_code_key`(`code`),
    INDEX `PaymentMethodConfig_code_idx`(`code`),
    INDEX `PaymentMethodConfig_isActive_displayOrder_idx`(`isActive`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DynamicApiConfig` (
    `id` VARCHAR(191) NOT NULL,
    `providerKey` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `baseUrl` VARCHAR(191) NULL,
    `apiKeyEncrypted` TEXT NULL,
    `apiSecretEncrypted` TEXT NULL,
    `webhookSecret` TEXT NULL,
    `isSandbox` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastTestedAt` DATETIME(3) NULL,
    `lastTestStatus` VARCHAR(191) NULL,
    `lastTestLatencyMs` INTEGER NULL,
    `lastTestError` TEXT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DynamicApiConfig_providerKey_key`(`providerKey`),
    INDEX `DynamicApiConfig_providerKey_idx`(`providerKey`),
    INDEX `DynamicApiConfig_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserSession` ADD CONSTRAINT `UserSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkspaceMember` ADD CONSTRAINT `WorkspaceMember_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkspaceMember` ADD CONSTRAINT `WorkspaceMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TenantSubscription` ADD CONSTRAINT `TenantSubscription_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiCreditTransaction` ADD CONSTRAINT `AiCreditTransaction_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiUsageLog` ADD CONSTRAINT `AiUsageLog_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Channel` ADD CONSTRAINT `Channel_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_assignedMemberId_fkey` FOREIGN KEY (`assignedMemberId`) REFERENCES `WorkspaceMember`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiAgentConfig` ADD CONSTRAINT `AiAgentConfig_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KnowledgeBase` ADD CONSTRAINT `KnowledgeBase_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KnowledgeDocument` ADD CONSTRAINT `KnowledgeDocument_knowledgeBaseId_fkey` FOREIGN KEY (`knowledgeBaseId`) REFERENCES `KnowledgeBase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KnowledgeDocument` ADD CONSTRAINT `KnowledgeDocument_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KnowledgeChunk` ADD CONSTRAINT `KnowledgeChunk_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `KnowledgeDocument`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KnowledgeChunk` ADD CONSTRAINT `KnowledgeChunk_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourierSetting` ADD CONSTRAINT `CourierSetting_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shipment` ADD CONSTRAINT `Shipment_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shipment` ADD CONSTRAINT `Shipment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentIntegration` ADD CONSTRAINT `PaymentIntegration_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentTransaction` ADD CONSTRAINT `PaymentTransaction_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentTransaction` ADD CONSTRAINT `PaymentTransaction_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Workflow` ADD CONSTRAINT `Workflow_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowExecution` ADD CONSTRAINT `WorkflowExecution_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowExecution` ADD CONSTRAINT `WorkflowExecution_workflowId_fkey` FOREIGN KEY (`workflowId`) REFERENCES `Workflow`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowStep` ADD CONSTRAINT `WorkflowStep_workflowId_fkey` FOREIGN KEY (`workflowId`) REFERENCES `Workflow`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingService` ADD CONSTRAINT `BookingService_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingAppointment` ADD CONSTRAINT `BookingAppointment_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingAppointment` ADD CONSTRAINT `BookingAppointment_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `BookingService`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingAppointment` ADD CONSTRAINT `BookingAppointment_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingAppointment` ADD CONSTRAINT `BookingAppointment_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryTransaction` ADD CONSTRAINT `InventoryTransaction_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryTransaction` ADD CONSTRAINT `InventoryTransaction_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUp` ADD CONSTRAINT `FollowUp_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUp` ADD CONSTRAINT `FollowUp_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomerTimelineEvent` ADD CONSTRAINT `CustomerTimelineEvent_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomerTimelineEvent` ADD CONSTRAINT `CustomerTimelineEvent_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditTopupRequest` ADD CONSTRAINT `CreditTopupRequest_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditTopupRequest` ADD CONSTRAINT `CreditTopupRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;



-- -----------------------------------------------------------------------------
-- Initial Production Seed: Super Admin & Primary Workspace
-- Default Login: admin@omniflow.ai / Admin123!
-- -----------------------------------------------------------------------------
INSERT INTO `User` (`id`, `email`, `passwordHash`, `name`, `isSuperAdmin`, `emailVerified`, `status`, `createdAt`, `updatedAt`)
VALUES ('usr_superadmin_01', 'admin@omniflow.ai', '$2b$10$kYhFjzmXrqAK6sogMLEnVubS98JS535FVLz7HFO2yeP7i1jbUnM0m', 'OmniFlow Super Admin', 1, 1, 'ACTIVE', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `email` = `email`;

INSERT INTO `Tenant` (`id`, `name`, `slug`, `currency`, `timezone`, `defaultLanguage`, `creditBalance`, `status`, `createdAt`, `updatedAt`)
VALUES ('tnt_demo_workspace_01', 'OmniFlow Store', 'omniflow-store', 'BDT', 'Asia/Dhaka', 'bn', 2500, 'ACTIVE', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `slug` = `slug`;

INSERT INTO `WorkspaceMember` (`id`, `tenantId`, `userId`, `role`, `createdAt`, `updatedAt`)
VALUES ('wm_superadmin_01', 'tnt_demo_workspace_01', 'usr_superadmin_01', 'OWNER', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `id` = `id`;

INSERT INTO `TenantSubscription` (`id`, `tenantId`, `planTier`, `billingCycle`, `status`, `currentPeriodStart`, `currentPeriodEnd`, `createdAt`, `updatedAt`)
VALUES ('sub_default_01', 'tnt_demo_workspace_01', 'PRO', 'MONTHLY', 'ACTIVE', NOW(3), DATE_ADD(NOW(3), INTERVAL 365 DAY), NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `id` = `id`;
