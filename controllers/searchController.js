const { body, validationResult } = require('express-validator');
const { query } = require('express-validator');

const Process = require('../models/process');
const Category = require('../models/category');
const Machine = require('../models/machine');
const async = require('async');

exports.search_query = function (req, res) {
  query('qs').trim().escape();

  //Since using GET method on search form, result is returned as req.query instead of req.body
  const qs = req.query.qs;

  if (qs) {
    async.parallel(
      {
        process_qs: function (callback) {
          Process.find({ name: { $regex: '.*' + qs + '.*', $options: 'i' } })
            .populate('machine')
            .exec(callback);
        },
        category_qs: function (callback) {
          Category.find({
            name: { $regex: '.*' + qs + '.*', $options: 'i' },
          }).exec(callback);
        },
        machine_qs: function (callback) {
          Machine.find({
            name: { $regex: '.*' + qs + '.*', $options: 'i' },
          }).exec(callback);
        },
      },
      function (err, results) {
        res.render('search', {
          title: `Search results for: "${qs}"`,
          error: err,
          data: results,
        });
      }
    );
  } else {
    res.render('search', { title: 'Invalid search term.' });
  }
};
