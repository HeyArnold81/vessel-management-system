import { PartialType } from '@nestjs/swagger';

import { CreatePortDto } from './create-port.dto.js';

export class UpdatePortDto extends PartialType(CreatePortDto) {}
