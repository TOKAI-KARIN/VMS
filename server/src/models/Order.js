const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'customerId',
        as: 'customer'
      });
      this.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'createdByUser'
      });
      this.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'updatedByUser'
      });
      this.belongsTo(models.Vehicle, {
        foreignKey: 'vehicleId',
        as: 'vehicle'
      });
      this.belongsTo(models.Location, {
        foreignKey: 'locationId',
        targetKey: 'id',
        as: 'location'
      });
    }
  }

  Order.init({
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '注文番号'
    },
    orderDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Vehicles',
        key: 'id'
      }
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    locationId: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    diskPad: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('受注', '注文済み', 'キャンセル'),
      allowNull: false,
      defaultValue: '受注'
    },
    brakeShoe: {
      type: DataTypes.STRING,
      allowNull: true
    },
    wiper: {
      type: DataTypes.STRING,
      allowNull: true
    },
    belt: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cleanFilter: {
      type: DataTypes.STRING,
      allowNull: true
    },
    airElement: {
      type: DataTypes.STRING,
      allowNull: true
    },
    oilElement: {
      type: DataTypes.STRING,
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    attachedPhotos: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '注文に添付された写真ファイル名の配列'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Order',
    hooks: {
      beforeCreate: async (order, options) => {
        // 注文番号が設定されていない場合、自動生成
        if (!order.orderNumber) {
          const orderDate = new Date(order.orderDate);
          const year = orderDate.getFullYear();
          const month = String(orderDate.getMonth() + 1).padStart(2, '0');
          const day = String(orderDate.getDate()).padStart(2, '0');
          
          // 同じ日付の注文数を取得
          const count = await Order.count({
            where: {
              orderDate: order.orderDate
            }
          });
          
          const sequence = String(count + 1).padStart(4, '0');
          order.orderNumber = `ORD-${year}${month}${day}-${sequence}`;
        }
      },
      afterCreate: async (order, options) => {
        try {
          // LINE WORKS通知を送信
          const { sendOrderNotification } = require('../utils/lineworks');
          const models = sequelize.models;
          sendOrderNotification(order, models).catch(error => {
            console.error('Failed to send LINE WORKS notification:', error);
          });
        } catch (error) {
          console.error('Error in Order afterCreate hook:', error);
        }
      }
    }
  });

  return Order;
}; 