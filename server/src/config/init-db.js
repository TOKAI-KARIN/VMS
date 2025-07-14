const { sequelize, User, Vehicle, Order } = require('../models');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    // データベースの同期
    await sequelize.sync({ force: true });
    console.log('データベースの同期が完了しました。');

    // 管理者ユーザーの作成
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      displayName: '管理者',
      locationId: null,
    });
    console.log('管理者ユーザーを作成しました。');

    // 店長ユーザーの作成
    const storeManagerUser = await User.create({
      username: 'storemanager1',
      password: 'storemanager123',
      role: '店長',
      displayName: '〇〇店長',
      locationId: '1',
    });
    console.log('店長ユーザーを作成しました。');

    // 顧客ユーザーの作成
    const customerUser = await User.create({
      username: 'customer1',
      password: 'customer123',
      role: 'customer',
      displayName: '株式会社A',
      locationId: '1',
    });
    console.log('顧客ユーザーを作成しました。');

    // 車両情報の作成
    const vehicle = await Vehicle.create({
      typeNumber: '201471007',
      categoryNumber: '3B',
      firstRegistrationDate: '2024-07-01',
      frameNumber: 'ZD8-020600',
      licensePlate: '三河 302は8070',
      vehicleType: '普通自動車',
      engineType: 'FA24',
      customerId: customerUser.id,
      locationId: '1',
    });
    console.log('車両情報を作成しました。');

    // 注文情報の作成
    const order = await Order.create({
      orderDate: '2024-03-20',
      vehicleId: vehicle.id,
      customerId: customerUser.id,
      locationId: '1',
      diskPad: 'フロント',
      brakeShoe: 'リア',
      wiper: 'フロント',
      belt: 'タイミングベルト',
      cleanFilter: 'エアコン',
      airElement: 'エアクリーナー',
      oilElement: 'オイルフィルター',
      remarks: '定期点検',
      createdBy: employeeUser.id,
      updatedBy: employeeUser.id,
    });
    console.log('注文情報を作成しました。');

    console.log('データベースの初期化が完了しました。');
  } catch (error) {
    console.error('データベース初期化エラー:', error);
  } finally {
    await sequelize.close();
  }
}

initializeDatabase(); 