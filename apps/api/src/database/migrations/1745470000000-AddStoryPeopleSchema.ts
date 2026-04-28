import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligns with `entities/story_person.entity.ts`.
 * Depends on `stories` + `people`.
 */
export class AddStoryPeople1745470000000 implements MigrationInterface {
  name = 'AddStoryPeople1745470000000';

  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "story_people" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "story_id" uuid NOT NULL,
        "person_id" uuid NOT NULL,
        "role_in_story" varchar(200) NOT NULL,
        "is_key_figure" boolean NOT NULL DEFAULT false,
        CONSTRAINT "story_people_story_fk"
          FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE,
        CONSTRAINT "story_people_person_fk"
          FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE,
        CONSTRAINT "story_people_story_person_uidx"
          UNIQUE ("story_id", "person_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "story_people_story_id_idx"
        ON "story_people" ("story_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "story_people_person_id_idx"
        ON "story_people" ("person_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "story_people";`);
  }
}
