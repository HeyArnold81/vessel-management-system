import { PartialType } from '@nestjs/swagger';

import { CreateCargoItemDto } from './create-cargo-item.dto.js';

export class UpdateCargoItemDto extends PartialType(CreateCargoItemDto) {}
