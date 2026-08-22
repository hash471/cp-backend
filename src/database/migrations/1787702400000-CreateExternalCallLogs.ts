import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `external_call_logs` table that persists outbound external API
 * request/response audit records. Mirrors ExternalCallLog entity.
 */
export class CreateExternalCallLogs1787702400000 implements MigrationInterface {
  name = 'CreateExternalCallLogs1787702400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // uuid_generate_v4() lives in the uuid-ossp extension (used by all uuid PKs here).
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "external_call_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "serviceName" character varying,
        "method" character varying NOT NULL,
        "url" text NOT NULL,
        "requestHeaders" jsonb,
        "requestBody" jsonb,
        "responseHeaders" jsonb,
        "responseBody" jsonb,
        "httpStatus" integer,
        "statusText" character varying,
        "success" boolean,
        "durationMs" integer,
        "errorMessage" text,
        "referenceId" character varying,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_external_call_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_external_call_logs_serviceName" ON "external_call_logs" ("serviceName")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_external_call_logs_referenceId" ON "external_call_logs" ("referenceId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_external_call_logs_referenceId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_external_call_logs_serviceName"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "external_call_logs"`);
  }
}
