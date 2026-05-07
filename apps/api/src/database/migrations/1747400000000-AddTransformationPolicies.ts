import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransformationPolicies1747400000000 implements MigrationInterface {
  name = 'AddTransformationPolicies1747400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "transformation_policy_status" AS ENUM (
        'active',
        'amended',
        'challenged',
        'partially_struck',
        'repealed'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "transformation_policies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(200) NOT NULL,
        "abbreviation" varchar(20),
        "slug" varchar(200) NOT NULL,
        "enabling_act" varchar(300),
        "status" "transformation_policy_status" NOT NULL,
        "purpose_summary" text NOT NULL,
        "plain_english_child" text NOT NULL,
        "plain_english_layperson" text NOT NULL,
        "plain_english_legal" text NOT NULL,
        "historical_context" text NOT NULL,
        "arguments_for" text NOT NULL,
        "arguments_against" text NOT NULL,
        "current_legal_challenges" text,
        "impact_on_ordinary_people" text NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transformation_policies" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "transformation_policies_slug_uidx"
      ON "transformation_policies" ("slug");
    `);

    await queryRunner.query(`
      ALTER TABLE "stories"
      ADD COLUMN "transformation_policy_id" uuid;
    `);

    await queryRunner.query(`
      CREATE INDEX "stories_transformation_policy_id_idx"
      ON "stories" ("transformation_policy_id");
    `);

    await queryRunner.query(`
      ALTER TABLE "stories"
      ADD CONSTRAINT "FK_stories_transformation_policy"
      FOREIGN KEY ("transformation_policy_id")
      REFERENCES "transformation_policies"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "stories" DROP CONSTRAINT "FK_stories_transformation_policy";
    `);
    await queryRunner.query(`DROP INDEX "public"."stories_transformation_policy_id_idx";`);
    await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN "transformation_policy_id";`);
    await queryRunner.query(`DROP INDEX "public"."transformation_policies_slug_uidx";`);
    await queryRunner.query(`DROP TABLE "transformation_policies";`);
    await queryRunner.query(`DROP TYPE "transformation_policy_status";`);
  }
}
