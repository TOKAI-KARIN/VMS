'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Orders', 'attachedPhotos', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: '注文に添付された写真ファイル名の配列'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Orders', 'attachedPhotos');
  }
}; 