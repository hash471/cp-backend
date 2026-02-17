import { Request } from 'express';
import { Officer } from '../../officers/entities/officer.entity';

export interface AuthenticatedRequest extends Request {
  user?: Officer;
}
