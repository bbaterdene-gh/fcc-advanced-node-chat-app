const passport = require('passport')
const ObjectID = require('mongodb').ObjectID
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt')
const GitHubStrategy = require('passport-github').Strategy
require('dotenv').config();

module.exports = function (app, myDataBase) {
  app.use(passport.initialize());
  app.use(passport.session());
  // Serialization and deserialization here...
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });

  // Be sure to add this...
  passport.use(new LocalStrategy(
    function(username, password, done) {
      myDataBase.findOne({ username: username }, function (err, user) {
        console.log('User '+ username +' attempted to log in.');
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (!bcrypt.compareSync(password, user.password)) { return done(null, false); }
        return done(null, user);
      });
    }
  ));

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "" + process.env.BASE_URL + "auth/github/callback",
  },
  function(accessToken, refreshToken, profile, done) {
    myDataBase.findOne({ username: profile.username }, function(err, user) {
      if (err) {
        done(err);
      } else if (user) {
        done(null, user);
      } else {
        const hash = bcrypt.hashSync('password', 12);
        myDataBase.insertOne({
          username: profile.username,
          password: hash
        },
          (err, doc) => {
            if (err) {
              done(err)
            } else {
              // The inserted document is held within
              // the ops property of the doc
              done(null, doc.ops[0]);
            }
          }
        )
      }
    })
  }
    
  ));

}