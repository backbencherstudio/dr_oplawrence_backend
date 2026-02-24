import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class VerifyEmailDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'Email address to verify',
    example: 'john@example.com',
  })
  email: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Email verification token/code',
    example: '123456',
  })
  token: string;
}
