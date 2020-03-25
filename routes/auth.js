const {Router} = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid-transport');
const User = require('../models/user');
const keys = require('../keys/index');
const regEmail = require('../emails/registration');
const resetEmail = require('../emails/reset');
const router = Router();

const transporter = nodemailer.createTransport(sendgrid({
    auth:{api_key:keys.SENDGRID_API_KEY}
}));

router.get('/login', async (req, res) => {
    res.render('auth/login', {
        title: 'Authentication',
        isLogin: true,
        loginError:req.flash('loginError'),
        registerError:req.flash('registerError')
    })
});

router.get('/logout', async (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login#login')
    })
});


router.post('/login', async (req, res) => {
    try{
        const {email,password} = req.body;
        const condidate = await User.findOne({email});
        if (condidate) {
            const areSame = await bcrypt.compare(password, condidate.password);

            if (areSame) {
                req.session.user = condidate;
                req.session.isAuthenticated = true;
                req.session.save(error => {
                    if (error) {
                        throw error
                    }
                    res.redirect('/')
                })
            } else {
                req.flash('loginError', 'Password is incorrect');
                res.redirect('/auth/login#login')
            }
        } else {
            req.flash('loginError', 'User is not in Datebase');
            res.redirect('/auth/login#login')
        }
    } catch(error) {
        console.log(error)
    }
});

router.post('/register', async(req,res) => {
    try{
        const { email, password, repeat, name } = req.body;
        const condidate = await User.findOne({email});

        if(condidate) {
            req.flash('registerError', 'Email already in use');
            res.redirect('/auth/login#register')
        } else {
            const hashedPassword = await bcrypt.hash(password,10);
            const user = new User({
                email, name, password:hashedPassword, cart:{items:[]}
            });
            await user.save();
            await transporter.sendMail(regEmail(email));
            res.redirect('/auth/login#login');
        }
    } catch(error) {
        console.log(error)
    }
});

router.get('/reset', (req,res) => {
    res.render('auth/reset', {
        title:'Forgot Password?',
        error:req.flash('error')
    })
});


router.get('/password/:token', async (req,res) => {

    if(!req.params.token){
        return res.redirect('/auth/login')
    }
    try{
        const user = await User.findOne({
            resetToken:req.params.token,
            resetTokenExp:{$gt:Date.now()}

        });

        if (!user) {
            return res.redirect('/auth/login');
        } else {
            res.render('auth/password', {
                title:'Restored Access',
                error:req.flash('error'),
                userId:user._id.toString(),
                token:req.params.token
            });
        }
    } catch (error) {
        console.log(error)
    }

});


router.post('/reset', (req,res) => {
    try{
        crypto.randomBytes(32, async(err,buffer) => {
            if (err) {
                req.flash.error('error', 'Something went wrong, Please try again later ');
               return res.redirect('/auth/reset')
            }

            const token = buffer.toString('hex');
            const condidate = await User.findOne({email:req.body.email});

            if (condidate) {
                condidate.resetToken = token;
                condidate.resetTokenExp = Date.now() + 60 * 60 * 1000;
                await condidate.save();
                await transporter.sendMail(resetEmail(condidate.email,token));
                res.redirect('/auth/login')
            } else {
                req.flash('error', 'Email is not valid');
                res.redirect('/auth/reset')
            }
        })
    } catch(error) {
        console.log(error)
    }
});

router.post('/password', async(req,res) => {
    try{

        const user = await User.findOne({
            id:req.body.userId,
            resetToken:req.body.token,
            resetTokenExp:{$gt:Date.now()}
        });

        if (!user) {
            req.flash('loginError', 'Token Expire!');
            res.redirect('/auth/login')
        } else {
            user.password = await bcrypt.hash(req.body.password,10);
            user.resetToken = undefined;
            user.resetTokenExp = undefined;
            await user.save();
            res.redirect('/auth/login');
        }

    } catch(error) {
        console.log('error: ', error)
    }
});


module.exports = router;