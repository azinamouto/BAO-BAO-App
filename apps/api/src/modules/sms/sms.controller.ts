import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@bao-bao/shared';

// Controller for SMS webhooks and operations
@ApiTags('SMS')
@Controller()
export class SmsController {
  constructor(@Inject(SmsService) private readonly smsService: SmsService) {}

  // SMS operations

  // Handle inbound SMS webhook
  @Post('webhooks/sms/inbound')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive driver SMS, parse commands, and trigger actions' })
  @ApiResponse({ status: 200, description: 'SMS processed and reply generated' })
  async inboundSms(
    @Body() body: { from: string; body: string; timestamp?: string },
    @Headers('x-sms-signature') signature?: string,
  ) {
    return this.smsService.handleInboundSms(body.from, body.body, signature);
  }

  // Handle SMS delivery receipts
  @Post('webhooks/sms/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delivery receipts from SMS gateway' })
  async smsStatus(@Body() body: any) {
    return { received: true, status: body.status || 'DELIVERED' };
  }

  // Get SMS logs
  @Get('admin/sms')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SMS log (debug/audit)' })
  async getSmsLogs() {
    return this.smsService.getSmsLogs();
  }

  /**
   * Sends a test SMS message.
   * @param body - Recipient and message
   * @returns SMS provider response
   */
  @Post('admin/sms/test')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send test SMS' })
  async testSms(@Body() body: { to: string; message: string }) {
    return this.smsService.sendTestSms(body.to, body.message);
  }
}
