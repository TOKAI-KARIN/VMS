const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Vehicle extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'customerId',
        as: 'customer'
      });
      this.hasMany(models.Order, {
        foreignKey: 'vehicleId',
        as: 'orders'
      });
    }
  }

  Vehicle.init({
    typeNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    categoryNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    firstRegistrationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    frameNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    licensePlate: {
      type: DataTypes.STRING,
      allowNull: true
    },
    vehicleType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    engineType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    locationId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    parts0: { type: DataTypes.STRING, allowNull: true },
    parts1: { type: DataTypes.STRING, allowNull: true },
    parts2: { type: DataTypes.STRING, allowNull: true },
    parts3: { type: DataTypes.STRING, allowNull: true },
    parts4: { type: DataTypes.STRING, allowNull: true },
    parts5: { type: DataTypes.STRING, allowNull: true },
    parts6: { type: DataTypes.STRING, allowNull: true },
    parts7: { type: DataTypes.STRING, allowNull: true },
    parts8: { type: DataTypes.STRING, allowNull: true },
    parts9: { type: DataTypes.STRING, allowNull: true },
    parts10: { type: DataTypes.STRING, allowNull: true },
    parts11: { type: DataTypes.STRING, allowNull: true },
    parts12: { type: DataTypes.STRING, allowNull: true },
    parts13: { type: DataTypes.STRING, allowNull: true },
    parts14: { type: DataTypes.STRING, allowNull: true },
    parts15: { type: DataTypes.STRING, allowNull: true },
    parts16: { type: DataTypes.STRING, allowNull: true },
    parts17: { type: DataTypes.STRING, allowNull: true },
    parts18: { type: DataTypes.STRING, allowNull: true },
    parts19: { type: DataTypes.STRING, allowNull: true },
    parts20: { type: DataTypes.STRING, allowNull: true },
    parts21: { type: DataTypes.STRING, allowNull: true },
    parts22: { type: DataTypes.STRING, allowNull: true },
    parts23: { type: DataTypes.STRING, allowNull: true },
    parts24: { type: DataTypes.STRING, allowNull: true }
  }, {
    sequelize,
    modelName: 'Vehicle'
  });

  return Vehicle;
}; 