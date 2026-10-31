import { prisma } from '@omniflow/database';
import { ConversationStatus, SenderType, MessageContentType } from '@omniflow/shared';

export async function processFollowupSequencesJob() {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  // Inactive conversations where customer asked a question but haven't placed an order
  const staleConversations = await prisma.conversation.findMany({
    where: {
      status: ConversationStatus.BOT_ACTIVE,
      lastMessageAt: { lte: twoHoursAgo },
      unreadCount: 0,
    },
    take: 10,
  });

  for (const conv of staleConversations) {
    await prisma.message.create({
      data: {
        tenantId: conv.tenantId,
        conversationId: conv.id,
        senderType: SenderType.BOT,
        content: 'আসসালামু আলাইকুম! আপনার পছন্দের পণ্যের সাইজ বা অর্ডার নিয়ে কোনো প্রশ্ন আছে কি? আমরা সাহায্য করতে প্রস্তুত!',
        contentType: MessageContentType.TEXT,
        aiGenerated: true,
      },
    });

    await prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: new Date() },
    });
  }

  return { followupsSent: staleConversations.length };
}
