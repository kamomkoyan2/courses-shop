const keys = require('../keys/index');


module.exports = function(email) {
  return {
      to:email,
      from:keys.EMAIL_FROM,
      subject:'Account Created Successfuly!',
      html:`
        <h1>Welcome Our Shop Center</h1>
        <p>you created Account successfully - ${email}</p>
        <hr />
        <a href="${keys.BASE_URL}">Shop Courses</a>
      `
  }
};