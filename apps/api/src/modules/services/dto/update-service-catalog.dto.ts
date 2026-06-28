import { PartialType } from '@nestjs/swagger';

import { CreateServiceCatalogDto } from './create-service-catalog.dto.js';

export class UpdateServiceCatalogDto extends PartialType(CreateServiceCatalogDto) {}
