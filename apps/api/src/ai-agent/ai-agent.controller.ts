import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { WorkspaceRole, AiAgentConfigInput } from '@omniflow/shared';

@Controller('api/v1/ai-agent')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  @Get('config')
  async getConfig(@Req() req: any) {
    return this.aiAgentService.getConfig(req.tenantId);
  }

  @Put('config')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async updateConfig(@Req() req: any, @Body() body: AiAgentConfigInput) {
    return this.aiAgentService.updateConfig(req.tenantId, body);
  }

  @Post('test-query')
  async testQuery(
    @Req() req: any,
    @Body() body: { query: string; imageUrl?: string }
  ) {
    return this.aiAgentService.generateResponse({
      tenantId: req.tenantId,
      userQuery: body.query,
      imageUrl: body.imageUrl,
    });
  }

  @Post('playground')
  async playgroundSimulation(
    @Req() req: any,
    @Body() body: { query: string; imageUrl?: string; conversationHistory?: any[] }
  ) {
    return this.aiAgentService.runPlaygroundSimulation({
      tenantId: req.tenantId,
      userQuery: body.query,
      imageUrl: body.imageUrl,
      conversationHistory: body.conversationHistory,
    });
  }

  @Post('transcribe-voice')
  async transcribeVoice(
    @Req() req: any,
    @Body() body: { audioBase64?: string; filename?: string }
  ) {
    const buffer = body.audioBase64
      ? Buffer.from(body.audioBase64, 'base64')
      : Buffer.from('mock_voice_audio_sample');
    return this.aiAgentService.transcribeVoice(buffer, body.filename);
  }

  @Post('synthesize-voice')
  async synthesizeVoice(
    @Req() req: any,
    @Body() body: { text: string; voice?: string }
  ) {
    const audioBuffer = await this.aiAgentService.synthesizeVoice(body.text, body.voice);
    return {
      audioBase64: audioBuffer.toString('base64'),
      mimeType: 'audio/mpeg',
    };
  }
}
