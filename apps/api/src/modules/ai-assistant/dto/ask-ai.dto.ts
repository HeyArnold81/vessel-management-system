import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, Length, ValidateNested } from 'class-validator';

export class AiAssistantMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty({ example: 'Summarise arrivals due today.' })
  @IsString()
  @Length(1, 4000)
  content!: string;
}

export class AskAiDto {
  @ApiProperty({ example: 'Which billing events need attention?' })
  @IsString()
  @Length(3, 1000)
  question!: string;

  @ApiPropertyOptional({ type: [AiAssistantMessageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiAssistantMessageDto)
  conversation?: AiAssistantMessageDto[];
}
