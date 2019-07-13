const { body,validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');

var Process = require('../models/process');
var ProcessInstance = require('../models/processinstance');

var async = require('async');

// Display list of all ProcessInstances.
exports.processinstance_list = function(req, res, next) {

    ProcessInstance.find()
      .populate('process')
      .exec(function (err, processinstances) {
        if (err) { return next(err); }
        // Successful, so render
        res.render('processinstance_list', { title: 'Process Instance List',
                                             processinstance_list: processinstances});
      });
      
  };

// Display detail page for a specific ProcessInstance.
exports.processinstance_detail = function(req, res, next) {

    ProcessInstance.findById(req.params.id)
    .populate('process')
    .exec(function (err, processinstance) {
      if (err) { return next(err); }
      if (processinstance==null) { // No results.
          var err = new Error('Process copy not found');
          err.status = 404;
          return next(err);
        }
      // Successful, so render.
      res.render('processinstance_detail', { title: 'Process:',
                                             processinstance:  processinstance});
    })

};

// Display ProcessInstance create form on GET.
exports.processinstance_create_get = function(req, res, next) {       

    Process.find({},'name')
    .exec(function (err, processes) {
      if (err) { return next(err); }
      // Successful, so render.
      res.render('processinstance_form', {title: 'Create ProcessInstance',
                                          process_list: processes});
    });
    
};

// Handle ProcessInstance create on POST.
exports.processinstance_create_post = [

    // Validate fields.
    body('process', 'Process must be specified').isLength({ min: 1 }).trim(),
    body('operator', 'Operator must be specified').isLength({ min: 1 }).trim(),
    body('scheduled_end', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
    sanitizeBody('process').trim().escape(),
    sanitizeBody('operator').trim().escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('scheduled_end').toDate(),
    
    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a ProcessInstance object with escaped and trimmed data.
        var processinstance = new ProcessInstance(
          { process: req.body.process,
            operator: req.body.operator,
            status: req.body.status,
            scheduled_end: req.body.scheduled_end
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Process.find({},'name')
                .exec(function (err, processes) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('processinstance_form', { title: 'Create ProcessInstance',
                                                         process_list : processes,
                                                         selected_process : processinstance.process._id,
                                                         errors: errors.array(),
                                                         processinstance: processinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            processinstance.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(processinstance.url);
                });
        }
    }
];

// Display ProcessInstance delete form on GET.
exports.processinstance_delete_get = function(req, res, next) {

    ProcessInstance.findById(req.params.id)
    .populate('process')
    .exec(function (err, processinstance) {
        if (err) { return next(err); }
        if (processinstance==null) { // No results.
            res.redirect('/dashboard/processinstances');
        }
        // Successful, so render.
        res.render('processinstance_delete', { title: 'Delete ProcessInstance',
                                               processinstance:  processinstance});
    })

};

// Handle ProcessInstance delete on POST.
exports.processinstance_delete_post = function(req, res, next) {
    
    // Assume valid ProcessInstance id in field.
    ProcessInstance.findByIdAndRemove(req.body.id, function deleteProcessInstance(err) {
        if (err) { return next(err); }
        // Success, so redirect to list of ProcessInstance items.
        res.redirect('/dashboard/processinstances');
        });

};

// Display ProcessInstance update form on GET.
exports.processinstance_update_get = function(req, res, next) {

    // Get process, authors and genres for form.
    async.parallel({
        processinstance: function(callback) {
            ProcessInstance.findById(req.params.id).populate('process').exec(callback)
        },
        processes: function(callback) {
            Process.find(callback)
        },

        }, function(err, results) {
            if (err) { return next(err); }
            if (results.processinstance==null) { // No results.
                var err = new Error('Process copy not found');
                err.status = 404;
                return next(err);
            }
            // Success.
            res.render('processinstance_form', { title: 'Update  ProcessInstance',
                                                 process_list : results.processes,
                                                 selected_process : results.processinstance.process._id,
                                                 processinstance: results.processinstance });
        });

};

// Handle processinstance update on POST.
exports.processinstance_update_post = [

    // Validate fields.
    body('process', 'Process must be specified').isLength({ min: 1 }).trim(),
    body('operator', 'Operator must be specified').isLength({ min: 1 }).trim(),
    body('scheduled_end', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
    sanitizeBody('process').trim().escape(),
    sanitizeBody('operator').trim().escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('scheduled_end').toDate(),
    
    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a ProcessInstance object with escaped/trimmed data and current id.
        var processinstance = new ProcessInstance(
          { process: req.body.process,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
           });

        if (!errors.isEmpty()) {
            // There are errors so render the form again, passing sanitized values and errors.
            Process.find({},'name')
                .exec(function (err, processes) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('processinstance_form', { title: 'Update ProcessInstance',
                                                         process_list : processes,
                                                         selected_process : processinstance.process._id,
                                                         errors: errors.array(),
                                                         processinstance: processinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            ProcessInstance.findByIdAndUpdate(req.params.id, processinstance, {}, function (err,theprocessinstance) {
                if (err) { return next(err); }
                   // Successful - redirect to detail page.
                   res.redirect(theprocessinstance.url);
                });
        }
    }
];