'use strict';

const {Model, DataTypes} = require('sequelize');

module.exports=(sequelize,DataTypes)=>{
    class Payment extends Model{
        static associate(models){
            this.belongsTo(models.Declaration,{
                foreignKey:'declarationId',
                as:'declaration'
            });
            this.belongsTo(models.User,{
                foreignKey:'userId',
                as:'user'
            });
        }
    }

    Payment.init({
        id:{
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4,
            primaryKey:true
        },
        declarationId:{
            type:DataTypes.UUID,
            allowNull:false
        },
        userId:{
            type:DataTypes.UUID,
            allowNull:false
        },
        amount:{
            type:DataTypes.DECIMAL(10,2),
            allowNull:false,
            validate:{
                min:0.01
            }
        },
        provider:{
            type:DataTypes.ENUM('ORANGE_MONEY','MVOLA','AIRTEL_MONEY'),
            allowNull:false
        },
        nifNumber:{
            type:DataTypes.DECIMAL(10,2),
            allowNull:false
        },
        transactionId:{
            type:DataTypes.STRING(100),
            allowNull:false,
            unique:true
        },
        status:{
            type:DataTypes.ENUM('PENDING','COMPLETED','FAILED'),
            defaultValue:'PENDING'
        },
        phoneNumber:{
            type:DataTypes.STRING(20),
            allowNull:false
        },
        metadata:{
            type:DataTypes.JSON,
            allowNull:false
        }
    },{
        sequelize,
        modelName:'Payment',
        tableName:'Payments',
        indexes:[
            {
                unique:true,
                fields:['transactionId']
            },
            {
                fields:['declarationId']
            },{
                fields:['nifNumber']
            },
            {
                fields:['userId']
            },
            {
                fields:['status']
            }

        ]
    })

    return Payment

}