import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Human impact reference sectors (8 rows), story/expenditure/commission join tables,
 * story.primary_impact_sector_id, public_expenditure_records.what_it_should_have_funded.
 */
export class AddHumanImpactLayer1747000000000 implements MigrationInterface {
  name = 'AddHumanImpactLayer1747000000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "impact_severity" AS ENUM ('low', 'medium', 'high', 'critical');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "impact_sectors" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "slug" varchar(50) NOT NULL UNIQUE,
        "name" varchar(100) NOT NULL,
        "icon" varchar(10),
        "constitutional_right" varchar(200),
        "what_was_promised" text NOT NULL,
        "ground_reality" text NOT NULL,
        "plain_english_child" text NOT NULL,
        "stat_headline" varchar(300),
        "stat_value" varchar(50),
        "stat_label" varchar(100),
        "stat_source" varchar(300),
        "stat_year" varchar(10),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      INSERT INTO "impact_sectors" (
        "slug", "name", "icon", "constitutional_right",
        "what_was_promised", "ground_reality", "plain_english_child",
        "stat_headline", "stat_value", "stat_label", "stat_source", "stat_year"
      )
      VALUES
      (
        'housing',
        'Housing',
        '🏠',
        'Section 26: Right to access adequate housing',
        $$The Constitution says government must take reasonable steps, within available resources, to help people gradually get access to decent housing. National and provincial programmes promised subsidised homes, RDP houses, and clearing the formal waiting list.$$,
        $$The national housing backlog is about 2.4 million households (2025-style planning figures reported in independent media). Delivery of new completed homes fell sharply — widely reported drops from on the order of 75,000 units in 2019 to roughly 25,000 in 2023. Press outlets have profiled households waiting decades on municipal lists.$$,
        $$Government said it would help families get proper homes. Millions of people are still waiting. When money for housing is stolen or wasted, families stay longer in shacks and informal settlements.$$,
        'About 2.4 million households in the housing backlog',
        '2.4M',
        'Households waiting',
        'Independent reports / housing advocacy estimates (see story citations)',
        '2025'
      ),
      (
        'water',
        'Water & sanitation',
        '💧',
        'Section 27: Access to health-care services, sufficient food and water',
        $$Government committed to extending safe drinking water and dignified sanitation — the right to basic water underpins health, dignity, and life.$$,
        $$Access remains deeply uneven: rural areas trail cities on “safely managed” water coverage, and tens of thousands of households still rely on bucket sanitation in parts of the country (Stats SA / service-delivery reporting summarized in public references).$$,
        $$Clean water and proper toilets are basic needs. If money for pipes, treatment plants, or maintenance vanishes, taps stay dry or unsafe and people get sick.$$,
        'Rural vs urban gap in safely managed water',
        '~37% / ~72%',
        'Rural / urban (illustrative)',
        'Stats SA household surveys & service-delivery literature',
        '2025'
      ),
      (
        'health',
        'Health care',
        '🏥',
        'Section 27: Access to health-care services',
        $$The Constitution promises access to health-care services; the state runs public clinics and hospitals so people are not priced out of care.$$,
        $$Public hospitals and clinics stay overcrowded, medicine stock-outs still occur, and corruption in procurement or infrastructure diverts funds meant for beds, staff, and medicine.$$,
        $$When hospital money is stolen, there are fewer nurses, longer queues, and sometimes no medicine when you are sick.$$,
        'Public sector under strain',
        'High',
        'Facility / procurement pressure',
        'Treasury, Auditor-General & health reporting',
        '2025'
      ),
      (
        'education',
        'Education',
        '📚',
        'Section 29: Right to basic education',
        $$Every child has the right to basic education, including adult basic education. Government must make it available and invest in schools.$$,
        $$Many schools still lack reliable toilets, safe classrooms, and maintenance; funds meant for infrastructure or learning materials can vanish into bad tenders.$$,
        $$If school money is stolen, children learn in broken buildings without books or toilets.$$,
        'Infrastructure & maintenance pressures',
        'System-wide',
        'School provisioning',
        'Treasury / provincial education reporting',
        '2025'
      ),
      (
        'jobs',
        'Jobs & livelihoods',
        '💼',
        'Chapter 2 socio-economic context & labour rights framework',
        $$The state committed to policies that expand work, skills, and fair labour practices so people can earn a living.$$,
        $$Official unemployment has been very high for years; expanded definitions that count discouraged workers show even larger labour-market distress, with steep inequality in who finds work (Stats SA labour releases).$$,
        $$When big contracts fail or money disappears, projects stop and people do not get the jobs they were promised.$$,
        'Broad unemployment pressures (incl. discouraged workers)',
        '~42%',
        'Expanded unemployment rate (contextual)',
        'Stats SA QLFS summaries (quarterly)',
        '2025'
      ),
      (
        'safety',
        'Safety & policing',
        '🛡️',
        'Section 12: Freedom and security of the person',
        $$People are meant to be safe from violence and illegal detention; police and prosecutors exist to protect communities.$$,
        $$High crime burden, investigative backlogs, and corruption in procurement or personnel hollow out the capacity that households rely on.$$,
        $$If policing money is wasted, there are fewer detectives and slower responses when someone is robbed or assaulted.$$,
        'Crime burden vs capacity',
        'High',
        'Public safety pressure',
        'SAPS / crime statistics context',
        '2025'
      ),
      (
        'food',
        'Food security',
        '🍞',
        'Section 27(1)(b): Right to sufficient food',
        $$The Constitution ties dignity to sufficient food; social grants and school nutrition programmes are part of the safety net.$$,
        $$Millions live below official food-poverty lines; lost social-spend or grant fraud directly shrinks what the poorest households can eat.$$,
        $$When grant or nutrition money is stolen, children go hungry and grocery money does not arrive.$$,
        'Millions below lower food-poverty lines',
        'Millions',
        'Household food stress',
        'Stats SA poverty statistics',
        '2025'
      ),
      (
        'transport',
        'Transport & mobility',
        '🚌',
        'Section 22: Freedom of trade, occupation and profession; commuter access',
        $$Government funds commuter rail, road maintenance, and subsidised transport so people can reach work, school, and hospitals.$$,
        $$Collapsed rail services, taxi violence shocks, and diverted infrastructure budgets strand commuters with higher costs and lost time.$$,
        $$If trains and buses fail, poor people pay more of their day and wages just to travel.$$,
        'Commuter rail & road strain',
        'Systemic',
        'Public mobility',
        'Prasa / municipal transport reporting',
        '2025'
      )
      ON CONFLICT ("slug") DO NOTHING;
    `);

    await queryRunner.query(`
      ALTER TABLE "stories"
      ADD COLUMN IF NOT EXISTS "primary_impact_sector_id" uuid;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "stories"
        ADD CONSTRAINT "stories_primary_impact_sector_id_fkey"
        FOREIGN KEY ("primary_impact_sector_id")
        REFERENCES "impact_sectors"("id")
        ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "stories_primary_impact_sector_id_idx"
      ON "stories" ("primary_impact_sector_id");
    `);

    await queryRunner.query(`
      ALTER TABLE "public_expenditure_records"
      ADD COLUMN IF NOT EXISTS "what_it_should_have_funded" text;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "story_impact_sectors" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "story_id" uuid NOT NULL,
        "sector_id" uuid NOT NULL,
        "impact_chain" text[] NOT NULL DEFAULT '{}',
        "impact_severity" "impact_severity" NOT NULL DEFAULT 'medium',
        "amount_diverted_rands" bigint,
        "people_affected_estimate" bigint,
        "plain_english_impact" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "story_impact_sectors_story_id_fkey"
          FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE,
        CONSTRAINT "story_impact_sectors_sector_id_fkey"
          FOREIGN KEY ("sector_id") REFERENCES "impact_sectors"("id") ON DELETE CASCADE,
        CONSTRAINT "story_impact_sectors_story_sector_uidx" UNIQUE ("story_id", "sector_id")
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "story_impact_sectors_story_id_idx"
      ON "story_impact_sectors" ("story_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "story_impact_sectors_sector_id_idx"
      ON "story_impact_sectors" ("sector_id");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "expenditure_impact_sectors" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "expenditure_record_id" uuid NOT NULL,
        "sector_id" uuid NOT NULL,
        "what_was_not_built" text NOT NULL,
        "alternative_use_description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "expenditure_impact_sectors_exp_id_fkey"
          FOREIGN KEY ("expenditure_record_id")
          REFERENCES "public_expenditure_records"("id") ON DELETE CASCADE,
        CONSTRAINT "expenditure_impact_sectors_sector_id_fkey"
          FOREIGN KEY ("sector_id") REFERENCES "impact_sectors"("id") ON DELETE CASCADE,
        CONSTRAINT "expenditure_impact_sectors_exp_sector_uidx"
          UNIQUE ("expenditure_record_id", "sector_id")
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "expenditure_impact_sectors_exp_id_idx"
      ON "expenditure_impact_sectors" ("expenditure_record_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "expenditure_impact_sectors_sector_id_idx"
      ON "expenditure_impact_sectors" ("sector_id");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "commission_impact_sectors" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "commission_id" uuid NOT NULL,
        "sector_id" uuid NOT NULL,
        "impact_summary" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "commission_impact_sectors_commission_id_fkey"
          FOREIGN KEY ("commission_id") REFERENCES "commissions"("id") ON DELETE CASCADE,
        CONSTRAINT "commission_impact_sectors_sector_id_fkey"
          FOREIGN KEY ("sector_id") REFERENCES "impact_sectors"("id") ON DELETE CASCADE,
        CONSTRAINT "commission_impact_sectors_commission_sector_uidx"
          UNIQUE ("commission_id", "sector_id")
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "commission_impact_sectors_commission_id_idx"
      ON "commission_impact_sectors" ("commission_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "commission_impact_sectors_sector_id_idx"
      ON "commission_impact_sectors" ("sector_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "commission_impact_sectors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "expenditure_impact_sectors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "story_impact_sectors"`);

    await queryRunner.query(`
      ALTER TABLE "public_expenditure_records"
      DROP COLUMN IF EXISTS "what_it_should_have_funded";
    `);

    await queryRunner.query(`
      ALTER TABLE "stories"
      DROP CONSTRAINT IF EXISTS "stories_primary_impact_sector_id_fkey";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "stories_primary_impact_sector_id_idx";
    `);
    await queryRunner.query(`
      ALTER TABLE "stories"
      DROP COLUMN IF EXISTS "primary_impact_sector_id";
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "impact_sectors"`);

    await queryRunner.query(`
      DO $$ BEGIN
        DROP TYPE "impact_severity";
      EXCEPTION WHEN undefined_object THEN NULL; END $$;
    `);
  }
}
