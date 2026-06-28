import { PartialType } from '@nestjs/swagger';

import { CreateMovementServiceDto } from './create-movement-service.dto.js';

export class UpdateMovementServiceDto extends PartialType(CreateMovementServiceDto) {}
