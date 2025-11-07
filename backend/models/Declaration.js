'use strict';

const {Model, DataTypes} = require('sequelize');



module.exports=(sequelize,DataTypes)=>{
    class Declaration extends Model{
        static associate(models){
            this.belongsTo(models.User,{
                foreignKey:'userId',
                as:'user'
            });
            this.hasOne(models.Payment,{
                foreignKey:'declarationId',
                as:'payment'
            });
        }
    }

    Declaration.init({
        id:{
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4,
            primaryKey:true
        },
        userId:{
            type:DataTypes.UUID,
            allowNull:false
        },
        amount:{
            type:DataTypes.DECIMAL(12,2),
            allowNull:false,
            validate:{
                min:0.01
            }
        },
        nifNumber:{
            type:DataTypes.STRING(20),
            allowNull:false
        },
        period:{
            type:DataTypes.STRING(10),
            allowNull:false,
            validate:{
                is:/^[0-9]{4}-[0-9]{2}$/
            }
        },
        activityType:{
            type:DataTypes.ENUM('ALIMENTAION','ARTISANAT','COMMERCE','SERVICES','AUTRE'),
            allowNull:false
        },
        status:{
            type:DataTypes.ENUM('PENDING','VALIDATED','PAID'),
            defaultValue:'PENDING'
        },
        taxAmount:{
            type:DataTypes.DECIMAL(10,2),
            allowNull:false,
            defaultValue:0
        },
        description:{
            type:DataTypes.TEXT,
            allowNull:true
        }
    },{
        sequelize,
        modelName:'Declaration',
        tableName:'Declarations',
        timestamps:true,
        indexes:[
            {
                unique:true,
                fields:['userId','period']
            },
            {
                fields:['status']
            },
            {
                fields:['nifNumber']
            },
            {
                fields:['period']
            }
        ]
    })
    return Declaration;

} 