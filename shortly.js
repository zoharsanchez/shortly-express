var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));



app.get('/', 
function(req, res) {
  console.log(req.session);
  res.render('index', {currentUser: req.session.authenticated, username: req.session.username});
});

app.get('/create', util.checkUser,
function(req, res) {
  res.render('index', {currentUser: req.session.authenticated, username: req.session.username});
});

app.get('/links', 
function(req, res) {
  Links.query('where', {username: req.body.username}).fetch({withRelated: ['users']}).then(function(links) {
    res.status(200).send(links.models);
  });
});

app.get('/login', function(req, res) {
  res.render('login', {currentUser: req.session.authenticated, username: req.session.username});
});

app.get('/signup', function(req, res) {
  res.render('signup', {currentUser: req.session.authenticated, username: req.session.username});
});

app.post('/links', util.checkUser,
function(req, res) {
  var uri = req.body.url;
  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  new User({
    username: username,
    password: password
  })
  .save()
  .then(function() {
    req.session[req.body.username] = true;
    req.session.username = req.body.username;
    req.session.authenticated = true;
    res.redirect('/');
  });
});

app.post('/login', util.checkUser, function(req, res) {
  req.session.authenticated = true;
  req.session.username = req.body.username;
  res.redirect('/');
});

app.get('/logout', function(req, res) {
  delete req.session.username;
  req.session.authenticated = false;
  delete req.session[req.body.username];
  res.redirect('/');
});


/*
  User.where({username: username})
  .fetch()
  .then(function(user) {
    return User.hashPassword(user);
  })
  .then(function(hash) {
    return User.where({
      username: username,
      password: hash
    })
    .fetch();
  })
  .then(function(results) {
    if (!results) {
      res.redirect('/login');
    } else {
      res.redirect('/');
    }
  })
  .catch(function(err) {
    console.log(err);
  });
*/

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
// 