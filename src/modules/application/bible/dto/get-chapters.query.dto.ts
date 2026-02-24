import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetChaptersQueryDto {
  @ApiProperty({
    description: 'Bible book ID',
    example: 'cmf3abc123bookid',
  })
  @IsString()
  @IsNotEmpty()
  bookId: string;
}
