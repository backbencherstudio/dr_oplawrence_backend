import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StripePayment } from '../../../common/lib/Payment/stripe/StripePayment';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDonationDto } from './dto/create-donation.dto';

@Injectable()
export class StripeService {
  constructor(private readonly prisma: PrismaService) {}

  async handleWebhook(rawBody: string, sig: string | string[]) {
    return StripePayment.handleWebhook(rawBody, sig);
  }

  async createDonationIntent(userId: string, dto: CreateDonationDto) {
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const currency = (dto.currency || 'usd').toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        billing_id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.email) {
      throw new BadRequestException('User email is required for donation');
    }

    let customerId = user.billing_id;

    if (!customerId) {
      const customer = await StripePayment.createCustomer({
        user_id: user.id,
        name: user.name || user.email,
        email: user.email,
      });

      customerId = customer.id;

      await this.prisma.user.update({
        where: { id: user.id },
        data: { billing_id: customerId },
      });
    }

    const paymentIntent = await StripePayment.createPaymentIntent({
      amount: dto.amount,
      currency,
      customer_id: customerId,
      metadata: {
        user_id: user.id,
        type: 'donation',
      },
    });

    await this.prisma.paymentTransaction.create({
      data: {
        user_id: user.id,
        type: 'donation',
        provider: 'stripe',
        reference_number: paymentIntent.id,
        status: 'pending',
        raw_status: paymentIntent.status,
        amount: dto.amount,
        currency,
      },
    });

    return {
      message: 'Donation intent created successfully',
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: dto.amount,
      currency,
      status: paymentIntent.status,
    };
  }
}
