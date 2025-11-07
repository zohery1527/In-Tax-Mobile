'use strict';

const {Model, DataTypes} = require('sequelize');

module.exports=(sequelize,DataTypes) =>{
    class Zone extends Model{
        static associate(models){
            this.hasMany(models.User,{
                foreignKey:'zoneId',
                as:'users'
            });
        }
    }

    Zone.init({
        id:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        name:{
            type:DataTypes.STRING(200),
            allowNull:false,
            unique:true
        },
        code:{
            type:DataTypes.STRING(10),
            allowNull:false,
            unique:true

        },
        region:{
            type:DataTypes.STRING(100),
            allowNull:false
        },
        isActive:{
            type:DataTypes.BOOLEAN,
            defaultValue:true
        }
    },{
        sequelize,
        modelName:'Zone',
        tableName:'Zones',
        indexes:[
            {
                unique:true,
                fields:['code']
            }
        ]
    });

    return Zone;
}