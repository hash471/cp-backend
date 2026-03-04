import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignStationDto {
  @ApiProperty({
    description: 'Name of the police station to assign',
    example: 'II Town',
  })
  @IsString()
  @IsNotEmpty()
  policeStation: string;
}
