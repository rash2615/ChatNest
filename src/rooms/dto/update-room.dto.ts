import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateRoomDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

