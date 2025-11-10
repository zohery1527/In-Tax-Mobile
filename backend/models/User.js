'use strict';

const {Model, DataTypes} = require('sequelize');

module.exports=(sequelize,DataTypes)=>{
    class User extends Model{
        static associate(models){
            this.hasMany(models.Declaration,{foreignKey:'userId',as:'declarations'});
            this.hasMany(models.Payment,{foreignKey:'userId',as:'payments'});
            this.belongsTo(models.Zone,{foreignKey:'zoneId',as:'zone'});
            this.hasMany(models.NIFHistory,{foreignKey:'userId',as:'nifHistories'});
            this.hasMany(models.PendingOTP,{foreignKey:'userId',as:'pendingOTPs'});
        }
    }

    User.init({
        id:{
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4,
            primaryKey:true,
        },
        firstName:{
            type:DataTypes.STRING(60),
            allowNull:false,
            validate:{
                notEmpty:true,
                len:[2,60]
            }
        },
        lastName:{
            type:DataTypes.STRING(60),
            allowNull:false,
            validate:{
                notEmpty:true,
                len:[2,60]
            }
        },
        phoneNumber:{
             type:DataTypes.STRING(20),
             unique:true,
             allowNull:false,
             validate:{
                is: {
                    args: /^(\+261|261|0)(23|32|33|34|38|39)[0-9]{7}$/,
                    msg:'Numéro malagasy invalide. EX: +261341234567 ou 0345689741'
                }
             }
        },
        role:{
            type:DataTypes.ENUM('VENDEUR','ADMIN','AGENT'),
            defaultValue:'VENDEUR'
        },
        zoneId:{
            type:DataTypes.INTEGER,
            allowNull:false
        },
        nifNumber:{
            type:DataTypes.STRING(20),
            allowNull:true,
            unique:true
        },
        nifAttributionDate:{
            type:DataTypes.DATE,
            allowNull:true
        },
        nifStatus:{
            type:DataTypes.ENUM('PENDING','VALIDATED','REJECTED'),
            defaultValue:'PENDING'
        },
        otpHash:{
            type:DataTypes.STRING,
            allowNull:true
        },
        otpExpirestAt:{
            type:DataTypes.DATE,
            allowNull:true
        },
        activityType:{
            type:DataTypes.ENUM('ALIMENTATION','ARTISANAT','COMMERCE','SERVICE','AUTRE'),
            allowNull:false
        },
        isActive:{
            type:DataTypes.BOOLEAN,
            defaultValue:true
        },
        fcmToken:{
            type:DataTypes.STRING,
            allowNull:true
        }
    },
    {
        sequelize,
        modelName:'User',
        tableName:'Users',
        timestamps:true,
        indexes:[
            {
                unique:true,
                fields:['phoneNumber']
            },{
                fields:['zoneId']
            },{
                fields:['nifNumber'],
                unique:true
            },
            {
                fields:['nifStatus']
            }
        ]
    }
)
    return User;

} 
