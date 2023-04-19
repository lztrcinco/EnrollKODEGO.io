let express = require('express');
const router = express.Router();
const register_controller = require('../controller/auth_account')

router.post('/register', register_controller.addAccount)
router.post('/login', register_controller.loginAccount)
router.post('/addstudent', register_controller.addStudent)
router.get('/updatestudent/:id', register_controller.updateStudentForm);
router.post('/updatestudent/', register_controller.updateStudent);
router.get('/deletestudent/:id', register_controller.deleteStudent)

module.exports = router;