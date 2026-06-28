import { PartialType } from '@nestjs/swagger';

import { CreateVesselDto } from './create-vessel.dto.js';

export class UpdateVesselDto extends PartialType(CreateVesselDto) {}
