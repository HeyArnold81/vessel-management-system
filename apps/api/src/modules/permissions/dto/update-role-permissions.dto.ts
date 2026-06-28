import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, Matches } from 'class-validator';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class UpdateRolePermissionsDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @IsString({ each: true })
  @Matches(uuidPattern, { each: true, message: 'Permission ids must be valid UUIDs.' })
  permissionIds!: string[];
}

export class RoleIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @Matches(uuidPattern, { message: 'Role id must be a valid UUID.' })
  roleId!: string;
}
