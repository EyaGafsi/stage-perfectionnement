import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTaskDates1700000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'tasks_it',
      new TableColumn({
        name: 'scheduledEndDate',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'tasks_it',
      new TableColumn({
        name: 'actualEndDate',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'tasks_it',
      new TableColumn({
        name: 'delayHours',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('tasks_it', 'delayHours');
    await queryRunner.dropColumn('tasks_it', 'actualEndDate');
    await queryRunner.dropColumn('tasks_it', 'scheduledEndDate');
  }
}