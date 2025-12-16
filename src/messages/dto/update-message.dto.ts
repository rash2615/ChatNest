import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateMessageDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  content?: string;
}

