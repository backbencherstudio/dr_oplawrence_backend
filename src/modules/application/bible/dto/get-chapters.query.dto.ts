import { IsNotEmpty, IsString } from 'class-validator';

export class GetChaptersQueryDto {
  @IsString()
  @IsNotEmpty()
  bookId: string;
}
