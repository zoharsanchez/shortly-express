var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  'tableName': 'users',
  initialize: function() {
    this.on('creating', this.hashPassword, this);
  },
  hashPassword: function(model, attrs, options) {
    return new Promise(function(resolve, reject) {
      bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(model.attributes.password, salt, null, function(err, hash) {
          model.set('password', hash);
          model.set('salt', salt);
          resolve(hash);
        });
      });
    });
  }
});

module.exports = User;     
