import { IsString, IsEnum, IsOptional } from 'class-validator';

export class UpdateTicketDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['open', 'in-progress', 'closed'])
  @IsOptional()
  status?: 'open' | 'in-progress' | 'closed';

  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  priority?: 'low' | 'medium' | 'high';

  @IsString()
  @IsOptional()
  assignedTo?: string;
}