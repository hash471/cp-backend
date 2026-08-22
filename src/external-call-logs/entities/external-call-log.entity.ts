import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Audit record of an outbound (external) API call made by the platform — e.g.
 * calls to the PGRS GrievanceApp. Captures the request/response payloads, HTTP
 * status and timing so integrations can be traced and debugged.
 */
@Entity('external_call_logs')
export class ExternalCallLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Friendly label for the external service/operation, e.g. "PGRS GetTokenAccess". */
  @Column({ type: 'varchar', nullable: true })
  @Index()
  serviceName: string | null;

  /** HTTP method used for the external call (GET, POST, ...). */
  @Column({ type: 'varchar' })
  method: string;

  /** Full URL of the external endpoint that was called. */
  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'jsonb', nullable: true })
  requestHeaders: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  requestBody: unknown | null;

  @Column({ type: 'jsonb', nullable: true })
  responseHeaders: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  responseBody: unknown | null;

  /** HTTP status code returned by the external endpoint. */
  @Column({ type: 'int', nullable: true })
  httpStatus: number | null;

  /** HTTP status text / reason phrase (e.g. "OK", "Unauthorized"). */
  @Column({ type: 'varchar', nullable: true })
  statusText: string | null;

  /** Whether the call is considered successful (defaults from a 2xx status). */
  @Column({ type: 'boolean', nullable: true })
  success: boolean | null;

  /** Round-trip duration of the external call in milliseconds. */
  @Column({ type: 'int', nullable: true })
  durationMs: number | null;

  /** Error message captured when the external call failed. */
  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  /** Optional correlation id (e.g. complaint number) to tie the call to a record. */
  @Column({ type: 'varchar', nullable: true })
  @Index()
  referenceId: string | null;

  /** Any additional caller-supplied context. */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
