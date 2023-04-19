let express = require('express');
const app = express();
const port = 5000;
const path = require('path');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config({
    path: './.env'
})
//Priority
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}))
app.use(cookieParser())

//Routes for the website
app.set('view engine', 'hbs')
app.use('/', require('./routes/register_routes'))
app.use('/auth', require('./routes/auth'))

app.listen(port, () => {
    console.log(`Server has started on port localhost:${port}/`)
}).on('error', (error) => {
    console.error(`Server failed to start: ${error}`)
})