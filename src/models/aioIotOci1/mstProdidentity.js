const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('mstProdidentity', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    tgl: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    target: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    lotno: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    prod_order: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    prod_start: {
      type: DataTypes.DATE,
      allowNull: true
    },
    prod_end: {
      type: DataTypes.DATE,
      allowNull: true
    },
    line: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    product: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    isActive: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    last_update: {
      type: DataTypes.DATE,
      allowNull: true
    },
    user: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    cycle_type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status_calculate: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'mst_prodidentity',
    hasTrigger: true,
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
