import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}

