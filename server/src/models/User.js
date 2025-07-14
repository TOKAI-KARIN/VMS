const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // ユーザーと車両の関連付け
      this.hasMany(models.Vehicle, {
        foreignKey: 'customerId',
        as: 'vehicles'
      });
      // ユーザーと注文の関連付け
      this.hasMany(models.Order, {
        foreignKey: 'customerId',
        as: 'orders'
      });
      // 作成者と注文の関連付け
      this.hasMany(models.Order, {
        foreignKey: 'createdBy',
        as: 'createdOrders'
      });
      // 更新者と注文の関連付け
      this.hasMany(models.Order, {
        foreignKey: 'updatedBy',
        as: 'updatedOrders'
      });
      // 拠点とユーザーの関連付け
      this.belongsTo(models.Location, {
        foreignKey: 'locationId',
        as: 'location'
      });
    }

    async validatePassword(password) {
      return bcrypt.compare(password, this.password);
    }
  }

  User.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'PA', '店頭PA', '店長', 'customer'),
      allowNull: false,
      defaultValue: 'customer'
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    locationId: {
      type: DataTypes.STRING,
      allowNull: true,
      // 所属拠点ID（adminはnull可、PA・customerは必須）
    }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  return User;
}; 