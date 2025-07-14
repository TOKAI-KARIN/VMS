'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Orders', 'status', {
      type: Sequelize.ENUM('受注', '注文済み', 'キャンセル'),
      allowNull: false,
      defaultValue: '受注'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Orders', 'status');
    // ENUM型自体も削除する必要がある
    await queryInterface.sequelize.query('DROP TYPE "enum_Orders_status";');
  }
}; 