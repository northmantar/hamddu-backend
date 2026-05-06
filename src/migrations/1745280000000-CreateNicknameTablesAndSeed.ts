import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNicknameTablesAndSeed1745280000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "nickname_adjectives" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "word" text NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_nickname_adjectives_word" UNIQUE ("word"),
        CONSTRAINT "PK_nickname_adjectives" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "nickname_nouns" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "word" text NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_nickname_nouns_word" UNIQUE ("word"),
        CONSTRAINT "PK_nickname_nouns" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "nickname_adjectives" ("word", "isActive") VALUES
      ('고독한', true),
      ('쓸쓸한', true),
      ('잔잔한', true),
      ('고요한', true),
      ('몽환적인', true),
      ('흐릿한', true),
      ('은은한', true),
      ('아련한', true),
      ('따뜻한', true),
      ('포근한', true),
      ('부드러운', true),
      ('차분한', true),
      ('느긋한', true),
      ('여유로운', true),
      ('평온한', true),
      ('말랑한', true),
      ('폭신한', true),
      ('동글한', true),
      ('수줍은', true),
      ('귀여운', true),
      ('깜찍한', true),
      ('사랑스러운', true),
      ('엉뚱한', true),
      ('장난꾸러기', true),
      ('졸린', true),
      ('게으른', true),
      ('집요한', true),
      ('날카로운', true),
      ('단단한', true),
      ('거친', true),
      ('무심한', true),
      ('냉정한', true),
      ('뜨거운', true),
      ('불타는', true),
      ('집착하는', true),
      ('완벽한', true),
      ('지친', true),
      ('바쁜', true),
      ('길 잃은', true),
      ('방황하는', true),
      ('외로운', true),
      ('설레는', true),
      ('긴장한', true),
      ('들뜬', true),
      ('우울한', true),
      ('행복한', true),
      ('배고픈', true),
      ('화난', true),
      ('멍한', true),
      ('이상한', true),
      ('수상한', true),
      ('정신없는', true),
      ('고장난', true),
      ('과몰입한', true),
      ('퇴근하고싶은', true),
      ('월요병걸린', true)
      ON CONFLICT ("word") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "nickname_nouns" ("word", "isActive") VALUES
      ('짧은뜨기', true),
      ('긴뜨기', true),
      ('한길긴뜨기', true),
      ('사슬뜨기', true),
      ('빼뜨기', true),
      ('겉뜨기', true),
      ('안뜨기', true),
      ('메리야스뜨기', true),
      ('가터뜨기', true),
      ('고무뜨기', true),
      ('쉘뜨기', true),
      ('부채무늬', true),
      ('V스티치', true),
      ('스타스티치', true),
      ('꽈배기', true),
      ('케이블뜨기', true),
      ('바스켓위브', true),
      ('와플뜨기', true),
      ('벌집무늬', true),
      ('보블뜨기', true),
      ('퍼프뜨기', true),
      ('팝콘뜨기', true),
      ('그래니스퀘어', true),
      ('아미구루미', true),
      ('레이스뜨기', true),
      ('리프무늬', true),
      ('파인애플무늬', true),
      ('메쉬뜨기', true),
      ('페더앤팬', true),
      ('나선뜨기', true),
      ('원형뜨기', true),
      ('모티브뜨기', true),
      ('아이코드', true),
      ('튜브뜨기', true)
      ON CONFLICT ("word") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "nickname_nouns"`);
    await queryRunner.query(`DROP TABLE "nickname_adjectives"`);
  }
}
