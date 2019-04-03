const { body,validationResult } = require('express-validator/check');
const { sanitizeQuery } = require('express-validator/filter');

var Process = require('../models/process');
var Category = require('../models/category');
var Machine = require('../models/machine');
var async = require('async');

exports.search_query = function(req, res) { 

  sanitizeQuery('qs').trim().escape();

  //Since using GET method on search form, result is returned as req.query instead of req.body
  var qs = req.query.qs;

  if (qs){
      async.parallel({
        process_qs: function(callback) {
          Process.find({name: { $regex: '.*' + qs + '.*', $options: 'i' }})
          .populate('machine')
          .exec(callback);
        },
        category_qs: function(callback) {
          Category.find({name: { $regex: '.*' + qs + '.*', $options: 'i' }})
          .exec(callback);
        },
        machine_qs: function(callback) {
          Machine.find({name: { $regex: '.*' + qs + '.*', $options: 'i' }})
          .exec(callback);
        }
    }, function(err, results) {
        res.render('search', { title: `Search results for: "${qs}"`,
                              error: err,
                              data: results });
    });
  } else {
    res.render('search', { title: 'Invalid search term.'});
  }

};