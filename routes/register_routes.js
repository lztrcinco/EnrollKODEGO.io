let express = require('express')
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index')
})
router.get('/login', (req, res) => {
    res.render('login')
})
router.get('/register', (req, res) => {
    res.render('register')
})
router.get('/addstudent', (req, res) => {
    res.render('addstudent')
})


module.exports = router;