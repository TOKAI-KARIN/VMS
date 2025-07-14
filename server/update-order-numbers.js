const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'my_app_db',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false
});

async function updateOrderNumbers() {
  try {
    await sequelize.authenticate();
    console.log('データベースに接続しました。');

    // 注文番号が設定されていない注文を取得
    const orders = await sequelize.query(
      'SELECT id, "orderDate" FROM "Orders" WHERE "orderNumber" IS NULL OR "orderNumber" = \'\' ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log(`${orders.length}件の注文に注文番号を設定します。`);

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const orderDate = new Date(order.orderDate);
      const year = orderDate.getFullYear();
      const month = String(orderDate.getMonth() + 1).padStart(2, '0');
      const day = String(orderDate.getDate()).padStart(2, '0');
      
      // 既存の注文番号をチェックして、重複しない番号を生成
      let sequence = 1;
      let orderNumber;
      let isUnique = false;
      
      while (!isUnique) {
        const sequenceStr = String(sequence).padStart(4, '0');
        orderNumber = `ORD-${year}${month}${day}-${sequenceStr}`;
        
        // この注文番号が既に存在するかチェック
        const existingResult = await sequelize.query(
          'SELECT COUNT(*) as count FROM "Orders" WHERE "orderNumber" = ?',
          {
            replacements: [orderNumber],
            type: Sequelize.QueryTypes.SELECT
          }
        );
        
        if (parseInt(existingResult[0].count) === 0) {
          isUnique = true;
        } else {
          sequence++;
        }
      }

      await sequelize.query(
        'UPDATE "Orders" SET "orderNumber" = ? WHERE id = ?',
        {
          replacements: [orderNumber, order.id],
          type: Sequelize.QueryTypes.UPDATE
        }
      );

      console.log(`注文ID ${order.id}: ${orderNumber}`);
    }

    console.log('注文番号の設定が完了しました。');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await sequelize.close();
  }
}

updateOrderNumbers(); 