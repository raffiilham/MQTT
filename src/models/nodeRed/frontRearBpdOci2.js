const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('frontRearBpdOci2', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    epochtime: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    lotno: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    pro: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    counter: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    front: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    rear: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    delta: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('current_timestamp')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('current_timestamp')
    }
  }, {
    sequelize,
    tableName: 'front_rear_bpd_oci2',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
