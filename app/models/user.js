var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  'tableName': 'users',
  initialize: function() {
    // console.log('hola');
    var model = this;
    var saltRounds = 10;
    this.on('creating', function(req, res) {
      var salt = bcrypt.genSaltSync(10);
      var hash = bcrypt.hashSync(model.attributes.password, salt);
      model.attributes.password = hash;
    }, this);

  }
});

module.exports = User;     
  // },
  // hashPassword: function(model, attrs, options) {
  //   console.log('b crypt', bcrypt.hash);
  //   return new Promise(function(resolve, reject) {
  //     console.log('pass to hash', model.attributes.password);
  //     bcrypt.hash(model.attributes.password, 10, (progress)=>{}, function(err, hash) {
  //       console.log('im a promise');
  //       if (err) {
  //         reject(err);
  //       }
  //       model.set('password', hash);
  //       resolve(hash); 
  //     });
  //   });
  // }