import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * State-owned entities (SOEs / PFMA schedule bodies), timeline rows, accountability links,
 * plus optional story / expenditure FKs.
 */
export class AddStateEntities1747100000000 implements MigrationInterface {
  name = 'AddStateEntities1747100000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const enums = [
      `DO $$ BEGIN CREATE TYPE "state_entity_sector" AS ENUM (
        'energy','transport_rail','transport_air','transport_road','logistics_ports',
        'communications','broadcasting','finance_development','finance_grants','water',
        'defence','research','education_funding','healthcare','forestry_agriculture','other'
      ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE "state_entity_pfma_schedule" AS ENUM (
        'schedule_2','schedule_3a','schedule_3b','schedule_3c','schedule_3d'
      ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE "state_entity_status" AS ENUM (
        'operational','business_rescue','restructuring','partially_privatised',
        'dissolved','merged','dormant'
      ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE "state_entity_financial_health" AS ENUM (
        'healthy','under_pressure','distressed','insolvent','unknown'
      ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE "state_entity_privatisation_status" AS ENUM (
        'not_discussed','under_debate','partial_privatisation_underway',
        'fully_privatised','government_committed_against'
      ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE "state_entity_timeline_event_type" AS ENUM (
        'established','major_achievement','financial_crisis','corruption_exposed',
        'bailout_received','leadership_change','restructuring','service_collapse',
        'legal_action','policy_change','privatisation_move','recovery'
      ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE "state_entity_timeline_significance" AS ENUM (
        'low','medium','high','critical'
      ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE "state_entity_commission_relationship_type" AS ENUM (
        'investigated','subject_of','implicated','reformed_by','bailout_linked'
      ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    ];
    for (const q of enums) {
      await queryRunner.query(q);
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "state_entities" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(200) NOT NULL,
        "popular_name" varchar(100) NOT NULL,
        "abbreviation" varchar(20) NOT NULL,
        "slug" varchar(200) NOT NULL,
        "sector" "state_entity_sector" NOT NULL,
        "pfma_schedule" "state_entity_pfma_schedule",
        "status" "state_entity_status" NOT NULL DEFAULT 'operational',
        "established_year" int NOT NULL,
        "established_by" varchar(200),
        "purpose_original" text NOT NULL,
        "purpose_plain_english" text NOT NULL,
        "why_it_matters_to_ordinary_people" text NOT NULL,
        "current_mandate_summary" text,
        "current_ceo" varchar(200),
        "supervising_ministry" varchar(200) NOT NULL,
        "government_ownership_percentage" decimal(5,2) NOT NULL DEFAULT 100,
        "latest_annual_loss_rands" bigint,
        "total_debt_rands" bigint,
        "total_bailouts_received_rands" bigint,
        "annual_budget_rands" bigint,
        "financial_health" "state_entity_financial_health" NOT NULL DEFAULT 'unknown',
        "financial_health_year" varchar(10),
        "health_score" int,
        "health_score_rationale" text,
        "is_in_crisis" boolean NOT NULL DEFAULT false,
        "crisis_summary" text,
        "privatisation_debate" text,
        "privatisation_status" "state_entity_privatisation_status" NOT NULL DEFAULT 'not_discussed',
        "primary_impact_sector_slug" varchar(50) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_state_entities" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_state_entities_slug" UNIQUE ("slug")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "state_entities_sector_idx"
        ON "state_entities" ("sector");
      CREATE INDEX IF NOT EXISTS "state_entities_status_idx"
        ON "state_entities" ("status");
      CREATE INDEX IF NOT EXISTS "state_entities_impact_sector_slug_idx"
        ON "state_entities" ("primary_impact_sector_slug");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "state_entity_timeline" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "state_entity_id" uuid NOT NULL,
        "year" int NOT NULL,
        "event_type" "state_entity_timeline_event_type" NOT NULL,
        "title" varchar(300) NOT NULL,
        "description" text NOT NULL,
        "plain_english" text,
        "amount_rands" bigint,
        "source_url" varchar(2000),
        "significance" "state_entity_timeline_significance" NOT NULL DEFAULT 'medium',
        "related_commission_slug" varchar(200),
        "related_siu_proclamation_slug" varchar(200),
        "related_story_slug" varchar(200),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_state_entity_timeline" PRIMARY KEY ("id"),
        CONSTRAINT "FK_timeline_state_entity"
          FOREIGN KEY ("state_entity_id") REFERENCES "state_entities"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "state_entity_timeline_state_entity_id_idx"
        ON "state_entity_timeline" ("state_entity_id");
      CREATE INDEX IF NOT EXISTS "state_entity_timeline_entity_year_idx"
        ON "state_entity_timeline" ("state_entity_id", "year");
      CREATE INDEX IF NOT EXISTS "state_entity_timeline_event_type_idx"
        ON "state_entity_timeline" ("event_type");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "state_entity_commission_links" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "state_entity_id" uuid NOT NULL,
        "commission_id" uuid,
        "adhoc_committee_id" uuid,
        "siu_proclamation_id" uuid,
        "accountability_body_id" uuid,
        "relationship_type" "state_entity_commission_relationship_type" NOT NULL,
        "summary" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_state_entity_commission_links" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sec_link_state_entity"
          FOREIGN KEY ("state_entity_id") REFERENCES "state_entities"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sec_link_commission"
          FOREIGN KEY ("commission_id") REFERENCES "commissions"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_sec_link_adhoc"
          FOREIGN KEY ("adhoc_committee_id") REFERENCES "adhoc_committees"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_sec_link_siu"
          FOREIGN KEY ("siu_proclamation_id") REFERENCES "siu_proclamations"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_sec_link_accountability_body"
          FOREIGN KEY ("accountability_body_id") REFERENCES "accountability_bodies"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "sec_link_entity_idx"
        ON "state_entity_commission_links" ("state_entity_id");
      CREATE INDEX IF NOT EXISTS "sec_link_commission_idx"
        ON "state_entity_commission_links" ("commission_id");
      CREATE INDEX IF NOT EXISTS "sec_link_adhoc_idx"
        ON "state_entity_commission_links" ("adhoc_committee_id");
      CREATE INDEX IF NOT EXISTS "sec_link_siu_idx"
        ON "state_entity_commission_links" ("siu_proclamation_id");
      CREATE INDEX IF NOT EXISTS "sec_link_body_idx"
        ON "state_entity_commission_links" ("accountability_body_id");
    `);

    await queryRunner.query(`
      ALTER TABLE "stories"
      ADD COLUMN IF NOT EXISTS "state_entity_id" uuid;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "stories"
        ADD CONSTRAINT "stories_state_entity_id_fkey"
        FOREIGN KEY ("state_entity_id")
        REFERENCES "state_entities"("id")
        ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "stories_state_entity_id_idx"
      ON "stories" ("state_entity_id");
    `);

    await queryRunner.query(`
      ALTER TABLE "public_expenditure_records"
      ADD COLUMN IF NOT EXISTS "state_entity_id" uuid;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "public_expenditure_records"
        ADD CONSTRAINT "public_expenditure_records_state_entity_id_fkey"
        FOREIGN KEY ("state_entity_id")
        REFERENCES "state_entities"("id")
        ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "public_expenditure_records_state_entity_id_idx"
      ON "public_expenditure_records" ("state_entity_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "public_expenditure_records" DROP CONSTRAINT IF EXISTS "public_expenditure_records_state_entity_id_fkey";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public_expenditure_records_state_entity_id_idx";
    `);
    await queryRunner.query(`
      ALTER TABLE "public_expenditure_records" DROP COLUMN IF EXISTS "state_entity_id";
    `);

    await queryRunner.query(`
      ALTER TABLE "stories" DROP CONSTRAINT IF EXISTS "stories_state_entity_id_fkey";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "stories_state_entity_id_idx";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories" DROP COLUMN IF EXISTS "state_entity_id";
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "state_entity_commission_links";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "state_entity_timeline";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "state_entities";`);

    for (const t of [
      'state_entity_commission_relationship_type',
      'state_entity_timeline_significance',
      'state_entity_timeline_event_type',
      'state_entity_privatisation_status',
      'state_entity_financial_health',
      'state_entity_status',
      'state_entity_pfma_schedule',
      'state_entity_sector',
    ]) {
      await queryRunner.query(`DROP TYPE IF EXISTS "${t}";`);
    }
  }
}
