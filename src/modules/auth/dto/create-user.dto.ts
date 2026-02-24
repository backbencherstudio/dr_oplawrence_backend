import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  name?: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'First name',
    example: 'John',
  })
  first_name?: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe',
  })
  last_name?: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Email address',
    example: 'john@example.com',
  })
  email?: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password should be minimum 8' })
  @ApiProperty({
    description: 'Password (minimum 8 characters)',
    example: 'StrongPass123',
    minLength: 8,
  })
  password: string;

  @ApiPropertyOptional({
    description: 'User type/role slug',
    type: String,
    example: 'user',
  })
  type?: string;
}
