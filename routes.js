const passport = require('passport')
const bcrypt = require('bcrypt')

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

module.exports = function (app, myDataBase) {
  // Be sure to change the title
  app
    .route('/').get((req, res) => {
    //Change the response to render the Pug template
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true,
    });
  });


  app.post('/login', passport.authenticate('local', { failureRedirect: '/' }), function(req, res) {
    res.redirect('/profile');
  });

  app
    .route('/profile')
    .get(ensureAuthenticated, (req,res) => {
      res.render('profile', {
        username: req.user.username,
      });
    });

  app.route('/logout')
    .get((req, res) => {
      req.logout();
      res.redirect('/');
    });

  app.route('/register')
    .post((req, res, next) => {
      myDataBase.findOne({ username: req.body.username }, function(err, user) {
        if (err) {
          next(err);
        } else if (user) {
          res.redirect('/');
        } else {
          const hash = bcrypt.hashSync(req.body.password, 12);
          myDataBase.insertOne({
            username: req.body.username,
            password: hash
          },
            (err, doc) => {
              if (err) {
                res.redirect('/');
              } else {
                // The inserted document is held within
                // the ops property of the doc
                next(null, doc.ops[0]);
              }
            }
          )
        }
      })}, passport.authenticate('local', { failureRedirect: '/' }), (req, res, next) => {
          res.redirect('/profile');
      },
    );

  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
}