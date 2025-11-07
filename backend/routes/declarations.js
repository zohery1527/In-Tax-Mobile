const express = require('express');
const router = express.Router();
const declarationController = require('../controllers/declarationController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', declarationController.createDeclaration);
router.get('/', declarationController.getUserDeclarations);
router.get('/:id', declarationController.getDeclaration);
router.put('/:id', declarationController.updateDeclaration);
router.get('/stats/status', declarationController.getDeclarationsStatus);
router.delete('/:id', declarationController.deleteDeclaration);

module.exports = router;