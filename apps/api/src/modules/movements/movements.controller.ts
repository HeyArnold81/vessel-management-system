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

import type { MovementRecord, PaginatedResponse } from '@vms/shared';

import {
  CreateMovementDto,
  ListMovementsQueryDto,
  MovementIdParamDto,
} from './dto/create-movement.dto.js';
import { UpdateMovementDto } from './dto/update-movement.dto.js';
import { MovementsService } from './movements.service.js';
import { requireTenantId } from './tenant-context.js';

@ApiTags('Movements')
@ApiSecurity('tenant')
@Controller('v1/movements')
export class MovementsController {
  constructor(@Inject(MovementsService) private readonly movementsService: MovementsService) {}

  @Get()
  @ApiOperation({ summary: 'List movements with search, filtering, sorting, and pagination.' })
  @ApiOkResponse({ description: 'Paginated movement list.' })
  list(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Query() query: ListMovementsQueryDto,
  ): Promise<PaginatedResponse<MovementRecord>> {
    return this.movementsService.list(requireTenantId(tenantHeader), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one movement by id.' })
  @ApiOkResponse({ description: 'Movement found.' })
  getById(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: MovementIdParamDto,
  ): Promise<MovementRecord> {
    return this.movementsService.getById(requireTenantId(tenantHeader), params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a movement.' })
  @ApiCreatedResponse({ description: 'Movement created.' })
  create(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: CreateMovementDto,
  ): Promise<MovementRecord> {
    return this.movementsService.create(requireTenantId(tenantHeader), body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a movement.' })
  @ApiOkResponse({ description: 'Movement updated.' })
  update(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: MovementIdParamDto,
    @Body() body: UpdateMovementDto,
  ): Promise<MovementRecord> {
    return this.movementsService.update(requireTenantId(tenantHeader), params.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a movement.' })
  @ApiOkResponse({ description: 'Movement soft deleted.' })
  remove(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: MovementIdParamDto,
  ): Promise<MovementRecord> {
    return this.movementsService.remove(requireTenantId(tenantHeader), params.id);
  }
}
