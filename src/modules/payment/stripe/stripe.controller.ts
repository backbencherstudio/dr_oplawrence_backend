import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  InternalServerErrorException,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';
import { TransactionRepository } from '../../../common/repository/transaction/transaction.repository';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Role } from '../../../common/guard/role/role.enum';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateDonationDto } from './dto/create-donation.dto';

@Controller('payment/stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(private readonly stripeService: StripeService) {}

  @ApiOperation({ summary: 'Create donation payment intent' })
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBody({ type: CreateDonationDto })
  @Post('donate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  async donate(@Req() req: Request, @Body() dto: CreateDonationDto) {
    const userId = req.user.userId;
    return this.stripeService.createDonationIntent(userId, dto);
  }

  @HttpCode(200)
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
  ) {
    try {
      if (!signature) {
        throw new BadRequestException('Missing stripe signature');
      }

      if (!req.rawBody) {
        throw new BadRequestException('Missing raw request body');
      }

      const payload = Buffer.isBuffer(req.rawBody)
        ? req.rawBody.toString('utf8')
        : String(req.rawBody);

      const event = await this.stripeService.handleWebhook(payload, signature);
      this.logger.log(
        `Stripe webhook received: ${event.type} (id: ${event.id})`,
      );

      // Handle events
      switch (event.type) {
        case 'customer.created':
          this.logger.log('Customer created event received');
          break;
        case 'payment_intent.created':
          this.logger.log('Payment intent created event received');
          break;
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          // create tax transaction
          // await StripePayment.createTaxTransaction(
          //   paymentIntent.metadata['tax_calculation'],
          // );
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: paymentIntent.id,
            status: 'succeeded',
            paid_amount: paymentIntent.amount / 100, // amount in dollars
            paid_currency: paymentIntent.currency,
            raw_status: paymentIntent.status,
          });
          this.logger.log(
            `Payment succeeded: ${paymentIntent.id}, amount=${paymentIntent.amount / 100} ${paymentIntent.currency}`,
          );
          break;
        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object;
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: failedPaymentIntent.id,
            status: 'failed',
            raw_status: failedPaymentIntent.status,
          });
          this.logger.warn(
            `Payment failed: ${failedPaymentIntent.id}, status=${failedPaymentIntent.status}`,
          );
          break;
        case 'payment_intent.canceled':
          const canceledPaymentIntent = event.data.object;
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: canceledPaymentIntent.id,
            status: 'canceled',
            raw_status: canceledPaymentIntent.status,
          });
          this.logger.warn(
            `Payment canceled: ${canceledPaymentIntent.id}, status=${canceledPaymentIntent.status}`,
          );
          break;
        case 'payment_intent.requires_action':
          const requireActionPaymentIntent = event.data.object;
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: requireActionPaymentIntent.id,
            status: 'requires_action',
            raw_status: requireActionPaymentIntent.status,
          });
          this.logger.warn(
            `Payment requires action: ${requireActionPaymentIntent.id}, status=${requireActionPaymentIntent.status}`,
          );
          break;
        case 'payout.paid':
          const paidPayout = event.data.object;
          this.logger.log(`Payout paid: ${paidPayout.id}`);
          break;
        case 'payout.failed':
          const failedPayout = event.data.object;
          this.logger.warn(`Payout failed: ${failedPayout.id}`);
          break;
        default:
          this.logger.warn(`Unhandled event type ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Webhook error', error?.stack || error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Webhook processing failed');
    }
  }
}
