// middleware/validate.js - NOUVEAU FICHIER
const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Remplacer le body par les données validées
    req.body = value;
    next();
  };
};

// Schémas de validation
const schemas = {
  register: Joi.object({
    phoneNumber: Joi.string()
      .pattern(/^(\+261|261|0)(23|32|33|34|38|39)[0-9]{7}$/)
      .required()
      .messages({
        'string.pattern.base': 'Numéro malagasy invalide'
      }),
    firstName: Joi.string().min(2).max(60).required(),
    lastName: Joi.string().min(2).max(60).required(),
    activityType: Joi.string()
      .valid('ALIMENTATION', 'ARTISANAT', 'COMMERCE', 'SERVICES', 'AUTRE')
      .required(),
    zoneId: Joi.number().integer().positive().required()
  }),

  login: Joi.object({
    phoneNumber: Joi.string()
      .pattern(/^(\+261|261|0)(23|32|33|34|38|39)[0-9]{7}$/)
      .required()
  }),

  verifyOTP: Joi.object({
    userId: Joi.string().uuid().required(),
    otpCode: Joi.string().length(6).pattern(/^\d+$/).required()
  }),

  declaration: Joi.object({
    amount: Joi.number().positive().max(999999999.99).required(),
    period: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
    activityType: Joi.string()
      .valid('ALIMENTATION', 'ARTISANAT', 'COMMERCE', 'SERVICES', 'AUTRE')
      .required(),
    description: Joi.string().max(1000).optional()
  })
};

module.exports = { validate, schemas };