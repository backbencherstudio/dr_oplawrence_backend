import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateDonationDto {
  @ApiProperty({
    example: 20,
    description: 'Donation amount',
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    example: 'usd',
    description: 'Currency code (default: usd)',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
