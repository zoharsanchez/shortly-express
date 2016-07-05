var request = require('request');
var User = require('../app/models/user');
var bcrypt = require('bcrypt-nodejs');
// var session = require('express-session');

exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/

exports.checkUser = function(req, res, next) {
  console.log('should go to next', req.session.authenticated);
  if (req.session.authenticated) {
    next();
  } else {
    var user = { username: req.body.username };
    var password = req.body.password;

    User.where(user)
    .fetch()
    .then(function(user) {
      console.log(user);
      if (!user) {
        res.redirect('/login');
      } else {
        bcrypt.compare(password, user.attributes.password, function(err, results) {
          if (err) {
            res.redirect('/login');
          }
          if (results) {
            req.session[user.attributes.username] = true;
            next();
          } else {
            res.redirect('/login');
          }
        });
      }
    })
    .catch((err) => {
      res.redirect('/login');
    });
  }

};
