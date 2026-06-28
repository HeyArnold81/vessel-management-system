import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import type { CargoItemRecord, PaginatedResponse } from '@vms/shared';

import { CargoItemsService } from './cargo-items.service.js';
import {
  CargoItemIdParamDto,
  CreateCargoItemDto,
  ListCargoItemsQueryDto,
} from './dto/create-cargo-item.dto.js';
import { UpdateCargoItemDto } from './dto/update-cargo-item.dto.js';
import { requireTenantId } from './tenant-context.js';

@ApiTags('Cargo')
@ApiSecurity('tenant')
@Controller('v1/cargo-items')
export class CargoItemsController {
  constructor(@Inject(CargoItemsService) private readonly cargoItemsService: CargoItemsService) {}

  @Get()
  @ApiOperation({
    summary: 'List cargo catalog items with search, filtering, sorting, and pagination.',
  })
  @ApiOkResponse({ description: 'Paginated cargo catalog list.' })
  list(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Query() query: ListCargoItemsQueryDto,
  ): Promise<PaginatedResponse<CargoItemRecord>> {
    return this.cargoItemsService.list(requireTenantId(tenantHeader), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one cargo catalog item by id.' })
  @ApiOkResponse({ description: 'Cargo item found.' })
  getById(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: CargoItemIdParamDto,
  ): Promise<CargoItemRecord> {
    return this.cargoItemsService.getById(requireTenantId(tenantHeader), params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a cargo catalog item.' })
  @ApiCreatedResponse({ description: 'Cargo item created.' })
  create(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: CreateCargoItemDto,
  ): Promise<CargoItemRecord> {
    return this.cargoItemsService.create(requireTenantId(tenantHeader), body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a cargo catalog item.' })
  @ApiOkResponse({ description: 'Cargo item updated.' })
  update(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: CargoItemIdParamDto,
    @Body() body: UpdateCargoItemDto,
  ): Promise<CargoItemRecord> {
    return this.cargoItemsService.update(requireTenantId(tenantHeader), params.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a cargo catalog item.' })
  @ApiOkResponse({ description: 'Cargo item soft deleted.' })
  remove(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: CargoItemIdParamDto,
  ): Promise<CargoItemRecord> {
    return this.cargoItemsService.remove(requireTenantId(tenantHeader), params.id);
  }
}
