const keys = require('../keys/index');


module.exports = function (email, token) {
    return {
        to:email,
        from:keys.EMAIL_FROM,
        subject:'Restored Access!',
        html:`
        <h1>You Forgot Password?</h1>
        <p>If no, ignore this message</p>
        <p>otherwise click on the link below</p>
        <p><a href="${keys.BASE_URL}/auth/password/${token}">Restored Access!</a></p>
        <hr />
        <a href="${keys.BASE_URL}">Shop Courses</a>
      `
    }
}