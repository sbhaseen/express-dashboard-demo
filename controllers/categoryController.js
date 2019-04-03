const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

var Category = require('../models/category');

var Process = require('../models/process');
var async = require('async');

// Display list of all Category.
exports.category_list = function(req, res, next) {

    Category.find()
      .sort([['name', 'ascending']])
      .exec(function (err, list_categories) {
        if (err) { return next(err); }
        // Successful, so render.
        res.render('category_list', { title: 'Category List', list_categories:  list_categories});
      });
  
  };

// Display detail page for a specific Category.
exports.category_detail = function(req, res, next) {

    async.parallel({
        category: function(callback) {
            Category.findById(req.params.id)
              .exec(callback);
        },

        category_processes: function(callback) {
          Process.find({ 'category': req.params.id })
          .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.category==null) { // No results.
            var err = new Error('Category not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('category_detail', { title: 'Category Detail',
                                        category: results.category,
                                        category_processes: results.category_processes } );
    });

};

// Display Category create form on GET.
exports.category_create_get = function(req, res, next) {     
    res.render('category_form', { title: 'Create Category' });
  };

// Handle Category create on POST.
exports.category_create_post =  [
   
    // Validate that the name field is not empty.
    body('name', 'Category name required').isLength({ min: 1 }).trim(),
    
    // Sanitize (trim and escape) the name field.
    sanitizeBody('name').trim().escape(),
  
    // Process request after validation and sanitization.
    (req, res, next) => {
  
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Create a category object with escaped and trimmed data.
      var category = new Category(
        { name: req.body.name }
      );
  
  
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render('category_form', { title: 'Create Category', category: category, errors: errors.array()});
        return;
      }
      else {
        // Data from form is valid.
        // Check if Category with same name already exists.
        Category.findOne({ 'name': req.body.name })
          .exec( function(err, found_category) {
             if (err) { return next(err); }
  
             if (found_category) {
               // Category exists, redirect to its detail page.
               res.redirect(found_category.url);
             }
             else {
  
               category.save(function (err) {
                 if (err) { return next(err); }
                 // Category saved. Redirect to category detail page.
                 res.redirect(category.url);
               });
  
             }
  
           });
      }
    }
  ];

// Display Category delete form on GET.
exports.category_delete_get = function(req, res, next) {

  async.parallel({
      category: function(callback) {
          Category.findById(req.params.id).exec(callback);
      },
      category_processes: function(callback) {
          Process.find({ 'category': req.params.id }).exec(callback);
      },
  }, function(err, results) {
      if (err) { return next(err); }
      if (results.category==null) { // No results.
          res.redirect('/dashboard/categories');
      }
      // Successful, so render.
      res.render('category_delete', { title: 'Delete Category', category: results.category, category_processes: results.category_processes } );
  });

};

// Handle Category delete on POST.
exports.category_delete_post = function(req, res, next) {

  async.parallel({
      category: function(callback) {
          Category.findById(req.params.id).exec(callback);
      },
      category_processes: function(callback) {
          Process.find({ 'category': req.params.id }).exec(callback);
      },
  }, function(err, results) {
      if (err) { return next(err); }
      // Success
      if (results.category_processes.length > 0) {
          // Category has pprocesses. Render in same way as for GET route.
          res.render('category_delete', { title: 'Delete Category', category: results.category, category_processes: results.category_processes } );
          return;
      }
      else {
          // Category has no pprocesses. Delete object and redirect to the list of categories.
          Category.findByIdAndRemove(req.body.id, function deleteCategory(err) {
              if (err) { return next(err); }
              // Success - go to categories list.
              res.redirect('/dashboard/categories');
          });

      }
  });

};


// Display Category update form on GET.
exports.category_update_get = function(req, res, next) {

  Category.findById(req.params.id, function(err, category) {
      if (err) { return next(err); }
      if (category==null) { // No results.
          var err = new Error('Category not found');
          err.status = 404;
          return next(err);
      }
      // Success.
      res.render('category_form', { title: 'Update Category', category: category });
  });

};

// Handle Category update on POST.
exports.category_update_post = [
 
  // Validate that the name field is not empty.
  body('name', 'Category name required').isLength({ min: 1 }).trim(),
  
  // Sanitize (trim and escape) the name field.
  sanitizeBody('name').trim().escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {

      // Extract the validation errors from a request .
      const errors = validationResult(req);

  // Create a category object with escaped and trimmed data (and the old id!)
      var category = new Category(
        {
        name: req.body.name,
        _id: req.params.id
        }
      );


      if (!errors.isEmpty()) {
          // There are errors. Render the form again with sanitized values and error messages.
          res.render('category_form', { title: 'Update Category', category: category, errors: errors.array()});
      return;
      }
      else {
          // Data from form is valid. Update the record.
          Category.findByIdAndUpdate(req.params.id, category, {}, function (err,thecategory) {
              if (err) { return next(err); }
                 // Successful - redirect to category detail page.
                 res.redirect(thecategory.url);
              });
      }
  }
];