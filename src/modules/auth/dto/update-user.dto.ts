import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Country',
    example: 'Nigeria',
  })
  country?: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'State',
    example: 'Lagos',
  })
  state?: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'City',
    example: 'Lagos',
  })
  city?: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Local government',
    example: 'Lagos',
  })
  local_government?: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Zip code',
    example: '123456',
  })
  zip_code?: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+91 9876543210',
  })
  phone_number?: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Address',
    example: 'New York, USA',
  })
  address?: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Gender',
    example: 'male',
  })
  gender?: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '14/11/2001',
  })
  date_of_birth?: string;
}
