const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

var Process = require('../models/process');
var Machine = require('../models/machine');
var Category = require('../models/category');
var ProcessInstance = require('../models/processinstance');

var async = require('async');

exports.index = function(req, res) {

   
    async.parallel({
        process_count: function(callback) {
            Process.countDocuments({}, callback);
        },
        process_instance_count: function(callback) {
            ProcessInstance.countDocuments({}, callback);
        },
        process_instance_scheduled_count: function(callback) {
            ProcessInstance.countDocuments({status:'Scheduled'}, callback);
        },
        process_instance_started_count: function(callback) {
            ProcessInstance.countDocuments({status:'Started'}, callback);
        },
        process_instance_finished_count: function(callback) {
            ProcessInstance.countDocuments({status:'Finished'}, callback);
        },
        process_category_primary_count: function(callback) {
            Process.aggregate([
                {
                  $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category_id'
                  }
                },
                { $unwind: '$category_id' },
                { $match: { 'category_id.name': 'Primary' } },
                { $group: { _id: null, count: { $sum: 1 } } },
              ], callback);
        },
        process_category_intermediate_count: function(callback) {
            Process.aggregate([
                {
                  $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category_id'
                  }
                },
                { $unwind: '$category_id' },
                { $match: { 'category_id.name': 'Intermediate' } },
                { $group: { _id: null, count: { $sum: 1 } } },
              ], callback);
        },
        process_category_finishing_count: function(callback) {
            Process.aggregate([
                {
                  $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category_id'
                  }
                },
                { $unwind: '$category_id' },
                { $match: { 'category_id.name': 'Finishing' } },
                { $group: { _id: null, count: { $sum: 1 } } },
              ], callback);
        },
        machine_count: function(callback) {
            Machine.countDocuments({}, callback);
        },
        category_count: function(callback) {
            Category.countDocuments({}, callback);
        },
    }, function(err, results) {
        console.log(results.process_category_finishing_count[0].count)
        res.render('index', { title: 'Dashboard Home',
                              error: err,
                              data: results });
    });
};

// Display list of all processes.
exports.process_list = function(req, res, next) {

    Process.find({}, 'name machine')
      .populate('machine')
      .sort([['machine', 'ascending']])
      .exec(function (err, list_processes) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('process_list', { title: 'Process List',
                                     process_list: list_processes });
      });      
};

// Display detail page for a specific process.
exports.process_detail = function(req, res, next) {

    async.parallel({
        process: function(callback) {

            Process.findById(req.params.id)
              .populate('machine')
              .populate('category')
              .exec(callback);
        },
        process_instance: function(callback) {

          ProcessInstance.find({ 'process': req.params.id })
          .exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.process==null) { // No results.
            var err = new Error('Process not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('process_detail', { title: 'Name',
                                       process: results.process,
                                       process_instances: results.process_instance } );
    });

};

// Display process create form on GET.
exports.process_create_get = function(req, res, next) { 
      
    // Get all machines and categories, which we can use for adding to our process.
    async.parallel({
        machines: function(callback) {
            Machine.find(callback);
        },
        categories: function(callback) {
            Category.find(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        res.render('process_form', { title: 'Create Process',
                                     machines: results.machines,
                                     categories: results.categories });
    });
    
};

// Handle process create on POST.
exports.process_create_post = [
    // Convert the category to an array.
    (req, res, next) => {
        if(!(req.body.category instanceof Array)){
            if(typeof req.body.category==='undefined')
            req.body.category=[];
            else
            req.body.category=new Array(req.body.category);
        }
        next();
    },

    // Validate fields.
    body('name', 'Name must not be empty.').isLength({ min: 1 }).trim(),
    body('machine', 'Machine must not be empty.').isLength({ min: 1 }).trim(),
    body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    body('serial_number', 'Serial Number must not be empty').isLength({ min: 1 }).trim(),
  
    // Sanitize fields (using wildcard).
    sanitizeBody('*').escape(),
    sanitizeBody('category.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Process object with escaped and trimmed data.
        var process = new Process(
          { name: req.body.name,
            machine: req.body.machine,
            summary: req.body.summary,
            serial_number: req.body.serial_number,
            category: req.body.category
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all machines and categories for form.
            async.parallel({
                machines: function(callback) {
                    Machine.find(callback);
                },
                categories: function(callback) {
                    Category.find(callback);
                },
            }, function(err, results) {
                if (err) {return next(err);}

                // Mark our selected categories as checked.
                for (let i = 0; i < results.categories.length; i++) {
                    if (process.category.indexOf(results.categories[i]._id) > -1) {
                        results.categories[i].checked='checked';
                    }
                }
                res.render('process_form', { title: 'Create Process',
                                             machines: results.machines,
                                             categories: results.categories,
                                             process: process,
                                             errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Save process.
            process.save(function (err) {
                if (err) { return next(err); }
                   //successful - redirect to new process record.
                   res.redirect(process.url);
                });
        }
    }
];

// Display process delete form on GET.
exports.process_delete_get = function(req, res, next) {

    async.parallel({
        process: function(callback) {
            Process.findById(req.params.id).populate('machine').populate('category').exec(callback);
        },
        process_processinstances: function(callback) {
            ProcessInstance.find({ 'process': req.params.id }).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.process==null) { // No results.
            res.redirect('/dashboard/processes');
        }
        // Successful, so render.
        res.render('process_delete', { title: 'Delete Process',
                                       process: results.process,
                                       process_instances: results.process_processinstances } );
    });

};

// Handle process delete on POST.
exports.process_delete_post = function(req, res, next) {

    // Assume the post has valid id (ie no validation/sanitization).

    async.parallel({
        process: function(callback) {
            Process.findById(req.body.id).populate('machine').populate('category').exec(callback);
        },
        process_processinstances: function(callback) {
            ProcessInstance.find({ 'process': req.body.id }).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.process_processinstances.length > 0) {
            // Process has process_instances. Render in same way as for GET route.
            res.render('process_delete', { title: 'Delete Process',
                                           process: results.process,
                                           process_instances: 
                                           results.process_processinstances } );
            return;
        }
        else {
            // Process has no ProcessInstance objects. Delete object and redirect to the list of processes.
            Process.findByIdAndRemove(req.body.id, function deleteProcess(err) {
                if (err) { return next(err); }
                // Success - got to processes list.
                res.redirect('/dashboard/processes');
            });

        }
    });

};

// Display process update form on GET.
exports.process_update_get = function(req, res, next) {

    // Get process, machines and categories for form.
    async.parallel({
        process: function(callback) {
            Process.findById(req.params.id).populate('machine').populate('category').exec(callback);
        },
        machines: function(callback) {
            Machine.find(callback);
        },
        categories: function(callback) {
            Category.find(callback);
        },
        }, function(err, results) {
            if (err) { return next(err); }
            if (results.process==null) { // No results.
                var err = new Error('Process not found');
                err.status = 404;
                return next(err);
            }
            // Success.
            // Mark our selected categories as checked.
            for (var all_g_iter = 0; all_g_iter < results.categories.length; all_g_iter++) {
                for (var process_g_iter = 0; process_g_iter < results.process.category.length; process_g_iter++) {
                    if (results.categories[all_g_iter]._id.toString()==results.process.category[process_g_iter]._id.toString()) {
                        results.categories[all_g_iter].checked='checked';
                    }
                }
            }
            res.render('process_form', { title: 'Update Process',
                                         machines:results.machines,
                                         categories:results.categories,
                                         process: results.process });
        });

};

// Handle process update on POST.
exports.process_update_post = [

    // Convert the category to an array
    (req, res, next) => {
        if(!(req.body.category instanceof Array)){
            if(typeof req.body.category==='undefined')
            req.body.category=[];
            else
            req.body.category=new Array(req.body.category);
        }
        next();
    },
   
    // Validate fields.
    body('name', 'Title must not be empty.').isLength({ min: 1 }).trim(),
    body('machine', 'Machine must not be empty.').isLength({ min: 1 }).trim(),
    body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
    body('serial_number', 'Serial Number must not be empty').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    sanitizeBody('name').trim().escape(),
    sanitizeBody('machine').trim().escape(),
    sanitizeBody('summary').trim().escape(),
    sanitizeBody('serial_number').trim().escape(),
    sanitizeBody('category.*').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Process object with escaped/trimmed data and old id.
        var process = new Process(
          { name: req.body.name,
            machine: req.body.machine,
            summary: req.body.summary,
            serial_number: req.body.serial_number,
            category: (typeof req.body.category==='undefined') ? [] : req.body.category,
            _id:req.params.id //This is required, or a new ID will be assigned!
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all machines and categories for form.
            async.parallel({
                machines: function(callback) {
                    Machine.find(callback);
                },
                categories: function(callback) {
                    Category.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected categories as checked.
                for (let i = 0; i < results.categories.length; i++) {
                    if (process.category.indexOf(results.categories[i]._id) > -1) {
                        results.categories[i].checked='checked';
                    }
                }
                res.render('process_form', { title: 'Update Process',
                                             machines:results.machines,
                                             categories:results.categories,
                                             process: process,
                                             errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Process.findByIdAndUpdate(req.params.id, process, {}, function (err,theprocess) {
                if (err) { return next(err); }
                   // Successful - redirect to process detail page.
                   res.redirect(theprocess.url);
                });
        }
    }
];