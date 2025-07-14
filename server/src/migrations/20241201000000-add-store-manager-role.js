'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. デフォルト値を削除
    await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN "role" DROP DEFAULT');
    
    // 2. TEXT型に変更
    await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN "role" TYPE TEXT');
    
    // 3. 古いENUM型を削除
    await queryInterface.sequelize.query('DROP TYPE "enum_Users_role"');
    
    // 4. 新しいENUM型を作成（店長を追加）
    await queryInterface.sequelize.query(`CREATE TYPE "enum_Users_role" AS ENUM('admin', 'PA', '店頭PA', '店長', 'customer')`);

    // 5. 新しいENUM型にカラムの型を変更
    await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN "role" TYPE "enum_Users_role" USING (role::"enum_Users_role")');

    // 6. デフォルト値を再設定
    await queryInterface.sequelize.query(`ALTER TABLE "Users" ALTER COLUMN "role" SET DEFAULT 'customer'`);
  },

  down: async (queryInterface, Sequelize) => {
    // 1. デフォルト値を削除
    await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN "role" DROP DEFAULT');
    
    // 2. TEXT型に変更
    await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN "role" TYPE TEXT');
    
    // 3. 古いENUM型を削除
    await queryInterface.sequelize.query('DROP TYPE "enum_Users_role"');
    
    // 4. 元のENUM型を作成
    await queryInterface.sequelize.query(`CREATE TYPE "enum_Users_role" AS ENUM('admin', 'PA', '店頭PA', 'customer')`);

    // 5. 元のENUM型にカラムの型を変更
    await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN "role" TYPE "enum_Users_role" USING (role::"enum_Users_role")');

    // 6. デフォルト値を再設定
    await queryInterface.sequelize.query(`ALTER TABLE "Users" ALTER COLUMN "role" SET DEFAULT 'customer'`);
  }
}; 