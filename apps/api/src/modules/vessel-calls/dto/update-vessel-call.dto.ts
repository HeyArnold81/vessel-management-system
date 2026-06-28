import { PartialType } from '@nestjs/swagger';

import { CreateVesselCallDto } from './create-vessel-call.dto.js';

export class UpdateVesselCallDto extends PartialType(CreateVesselCallDto) {}
