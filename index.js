const express = require('express');
const path = require('path');
const csrf = require('csurf');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');
const session = require('express-session');
const MongoStore = require('connect-mongodb-session')(session);
const homeRoutes = require('./routes/home');
const cardRoutes = require('./routes/card');
const addRoutes = require('./routes/add');
const orderRoutes = require('./routes/orders');
const coursesRoutes = require('./routes/courses');
const authRoutes = require('./routes/auth');
const varMiddlware = require('./middleware/variables');
const userMiddleware = require('./middleware/user');
const keys = require('./keys/index');

const app = express();

const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: 'hbs'
});

const store = new MongoStore({
  collection:'sessions',
  uri:keys.MONGODB_URI

});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', 'views');


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended: true}));
app.use(session({
  secret:keys.SESSION_SECRET,
  resave:false,
  saveUninitialized:false,
  store
}));
app.use(csrf());
app.use(flash());
app.use(varMiddlware);
app.use(userMiddleware);
app.use('/', homeRoutes);
app.use('/add', addRoutes);
app.use('/courses', coursesRoutes);
app.use('/card', cardRoutes);
app.use('/orders', orderRoutes);
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await mongoose.connect(keys.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify:false});
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })  
  } catch (error) {
    console.log(error)
  }
}

start();

