import { PartialType } from '@nestjs/swagger';

import { CreateBerthDto } from './create-berth.dto.js';

export class UpdateBerthDto extends PartialType(CreateBerthDto) {}
