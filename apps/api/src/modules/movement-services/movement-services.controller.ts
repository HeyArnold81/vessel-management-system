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

import type { MovementServiceRecord, PaginatedResponse } from '@vms/shared';

import {
  CreateMovementServiceDto,
  ListMovementServicesQueryDto,
  MovementServiceIdParamDto,
} from './dto/create-movement-service.dto.js';
import { UpdateMovementServiceDto } from './dto/update-movement-service.dto.js';
import { MovementServicesService } from './movement-services.service.js';
import { requireTenantId } from './tenant-context.js';

@ApiTags('Movement Services')
@ApiSecurity('tenant')
@Controller('v1/movement-services')
export class MovementServicesController {
  constructor(
    @Inject(MovementServicesService)
    private readonly movementServicesService: MovementServicesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List movement services with filtering, sorting, and pagination.' })
  @ApiOkResponse({ description: 'Paginated movement service list.' })
  list(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Query() query: ListMovementServicesQueryDto,
  ): Promise<PaginatedResponse<MovementServiceRecord>> {
    return this.movementServicesService.list(requireTenantId(tenantHeader), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one movement service by id.' })
  @ApiOkResponse({ description: 'Movement service found.' })
  getById(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: MovementServiceIdParamDto,
  ): Promise<MovementServiceRecord> {
    return this.movementServicesService.getById(requireTenantId(tenantHeader), params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a movement service.' })
  @ApiCreatedResponse({ description: 'Movement service created.' })
  create(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: CreateMovementServiceDto,
  ): Promise<MovementServiceRecord> {
    return this.movementServicesService.create(requireTenantId(tenantHeader), body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a movement service.' })
  @ApiOkResponse({ description: 'Movement service updated.' })
  update(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: MovementServiceIdParamDto,
    @Body() body: UpdateMovementServiceDto,
  ): Promise<MovementServiceRecord> {
    return this.movementServicesService.update(requireTenantId(tenantHeader), params.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a movement service.' })
  @ApiOkResponse({ description: 'Movement service cancelled.' })
  remove(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: MovementServiceIdParamDto,
  ): Promise<MovementServiceRecord> {
    return this.movementServicesService.remove(requireTenantId(tenantHeader), params.id);
  }
}
