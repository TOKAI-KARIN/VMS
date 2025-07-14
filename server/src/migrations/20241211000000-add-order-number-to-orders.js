'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Orders', 'orderNumber', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
      comment: '注文番号'
    });

    // 既存の注文に注文番号を生成して設定
    const orders = await queryInterface.sequelize.query(
      'SELECT id, "orderDate" FROM "Orders" ORDER BY id',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const orderDate = new Date(order.orderDate);
      const year = orderDate.getFullYear();
      const month = String(orderDate.getMonth() + 1).padStart(2, '0');
      const day = String(orderDate.getDate()).padStart(2, '0');
      const sequence = String(i + 1).padStart(4, '0');
      const orderNumber = `ORD-${year}${month}${day}-${sequence}`;

      await queryInterface.sequelize.query(
        'UPDATE "Orders" SET "orderNumber" = ? WHERE id = ?',
        {
          replacements: [orderNumber, order.id],
          type: queryInterface.sequelize.QueryTypes.UPDATE
        }
      );
    }

    // 注文番号をNOT NULLに変更
    await queryInterface.changeColumn('Orders', 'orderNumber', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      comment: '注文番号'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Orders', 'orderNumber');
  }
}; 