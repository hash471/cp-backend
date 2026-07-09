import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Officer } from '../officers/entities/officer.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Role } from '../officers/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Officer)
    private readonly officerRepository: Repository<Officer>,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; officer: Partial<Officer> }> {
    const officer = await this.officerRepository.findOne({
      where: { username: loginDto.username, isActive: true },
    });

    if (!officer || !(await bcrypt.compare(loginDto.password, officer.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: officer.id,
      username: officer.username,
      role: officer.role,
    };

    const access_token = this.jwtService.sign(payload);
    const { password, ...officerData } = officer;

    return { access_token, officer: officerData };
  }

  async changePassword(
    dto: ChangePasswordDto,
    requestingOfficer: Officer,
  ): Promise<void> {
    const targetId = dto.officerId || requestingOfficer.id;

    const target = await this.officerRepository.findOne({
      where: { id: targetId },
    });
    if (!target) {
      throw new NotFoundException('Officer not found');
    }

    // If changing someone else's password, check hierarchy
    if (targetId !== requestingOfficer.id) {
      this.assertCanChangePassword(requestingOfficer, target);
    }

    target.password = await bcrypt.hash(dto.newPassword, 10);
    await this.officerRepository.save(target);
  }

  private assertCanChangePassword(
    requester: Officer,
    target: Officer,
  ): void {
    const { role: rRole, zone: rZone, subDivision: rSub, policeStation: rStation } = requester;
    const { role: tRole, zone: tZone, subDivision: tSub, policeStation: tStation } = target;

    // Admin / Commissioner / Joint Commissioner → anyone
    if (rRole === Role.ADMIN || rRole === Role.COMMISSIONER || rRole === Role.JOINT_COMMISSIONER) {
      return;
    }

    // DCP → ACP, INSPECTOR, SUB_INSPECTOR in same zone
    if (rRole === Role.DCP) {
      if (
        [Role.ACP, Role.INSPECTOR, Role.SUB_INSPECTOR].includes(tRole) &&
        rZone === tZone
      ) {
        return;
      }
      throw new ForbiddenException(
        'DCP can only change passwords of ACP, Inspector, and Sub-Inspector in their zone',
      );
    }

    // ACP → INSPECTOR, SUB_INSPECTOR in same subdivision
    if (rRole === Role.ACP) {
      if (
        [Role.INSPECTOR, Role.SUB_INSPECTOR].includes(tRole) &&
        rSub === tSub
      ) {
        return;
      }
      throw new ForbiddenException(
        'ACP can only change passwords of Inspector and Sub-Inspector in their subdivision',
      );
    }

    // INSPECTOR → SUB_INSPECTOR in same station
    if (rRole === Role.INSPECTOR) {
      if (tRole === Role.SUB_INSPECTOR && rStation === tStation) {
        return;
      }
      throw new ForbiddenException(
        'Inspector can only change passwords of Sub-Inspector in their station',
      );
    }

    throw new ForbiddenException(
      'You do not have permission to change this password',
    );
  }
}
