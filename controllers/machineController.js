const { body, validationResult } = require('express-validator');

const Machine = require('../models/machine');

const async = require('async');
const Process = require('../models/process');

// Display list of all Machines.
exports.machine_list = function (req, res, next) {
  Machine.find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_machines) {
      if (err) {
        return next(err);
      }
      //Successful, so render
      res.render('machine_list', {
        title: 'Machine List',
        machine_list: list_machines,
      });
    });
};

// Display detail page for a specific Machine.
exports.machine_detail = function (req, res, next) {
  async.parallel(
    {
      machine: function (callback) {
        Machine.findById(req.params.id).exec(callback);
      },
      machines_processes: function (callback) {
        Process.find({ machine: req.params.id }, 'name summary').exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      } // Error in API usage.
      if (results.machine == null) {
        // No results.
        const err = new Error('Machine not found');
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render('machine_detail', {
        title: 'Machine Detail',
        machine: results.machine,
        machine_processes: results.machines_processes,
      });
    }
  );
};

// Display Machine create form on GET.
exports.machine_create_get = function (req, res, next) {
  res.render('machine_form', { title: 'Create Machine' });
};

// Handle Machine create on POST.
exports.machine_create_post = [
  // Validate fields.
  body('name', 'Name must not be empty.').isLength({ min: 1 }),
  body('date_of_commissioning', 'Invalid date of commissioning')
    .optional({ checkFalsy: true })
    .isISO8601(),
  body('date_of_retirement', 'Invalid date of retirement')
    .optional({ checkFalsy: true })
    .isISO8601(),

  // Sanitize fields.
  body('name').escape(),
  body('date_of_commissioning').toDate(),
  body('date_of_retirement').toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render('machine_form', {
        title: 'Create Machine',
        machine: req.body,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.

      // Create an Machine object with escaped and trimmed data.
      const machine = new Machine({
        name: req.body.name,
        date_of_commissioning: req.body.date_of_commissioning,
        date_of_retirement: req.body.date_of_retirement,
      });
      machine.save(function (err) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to new machine record.
        res.redirect(machine.url);
      });
    }
  },
];

// Display Machine delete form on GET.
exports.machine_delete_get = function (req, res, next) {
  async.parallel(
    {
      machine: function (callback) {
        Machine.findById(req.params.id).exec(callback);
      },
      machines_processes: function (callback) {
        Process.find({ machine: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.machine == null) {
        // No results.
        res.redirect('/dashboard/machines');
      }
      // Successful, so render.
      res.render('machine_delete', {
        title: 'Delete Machine',
        machine: results.machine,
        machine_processess: results.machines_processes,
      });
    }
  );
};

// Handle Machine delete on POST.
exports.machine_delete_post = function (req, res, next) {
  async.parallel(
    {
      machine: function (callback) {
        Machine.findById(req.body.machineid).exec(callback);
      },
      machines_processes: function (callback) {
        Process.find({ machine: req.body.machineid }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      // Success
      if (results.machines_processes.length > 0) {
        // Machine has processess. Render in same way as for GET route.
        res.render('machine_delete', {
          title: 'Delete Machine',
          machine: results.machine,
          machine_processes: results.machines_processes,
        });
        return;
      } else {
        // Machine has no processess. Delete object and redirect to the list of machines.
        Machine.findByIdAndRemove(req.body.machineid, function deleteMachine(
          err
        ) {
          if (err) {
            return next(err);
          }
          // Success - go to machine list
          res.redirect('/dashboard/machines');
        });
      }
    }
  );
};

// Display Machine update form on GET.
exports.machine_update_get = function (req, res, next) {
  Machine.findById(req.params.id, function (err, machine) {
    if (err) {
      return next(err);
    }
    if (machine == null) {
      // No results.
      const err = new Error('Machine not found');
      err.status = 404;
      return next(err);
    }
    // Success.
    res.render('machine_form', { title: 'Update Machine', machine: machine });
  });
};

// Handle Machine update on POST.
exports.machine_update_post = [
  // Validate fields.
  body('name', 'Name must not be empty.').isLength({ min: 1 }),
  body('date_of_commissioning', 'Invalid date of commissioning')
    .optional({ checkFalsy: true })
    .isISO8601(),
  body('date_of_retirement', 'Invalid date of retirement')
    .optional({ checkFalsy: true })
    .isISO8601(),

  // Sanitize fields.
  body('name').escape(),
  body('date_of_commissioning').toDate(),
  body('date_of_retirement').toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create Machine object with escaped and trimmed data (and the old id!)
    const machine = new Machine({
      name: req.body.name,
      date_of_commissioning: req.body.date_of_commissioning,
      date_of_retirement: req.body.date_of_retirement,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values and error messages.
      res.render('machine_form', {
        title: 'Update Machine',
        machine: machine,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      Machine.findByIdAndUpdate(req.params.id, machine, {}, function (
        err,
        themachine
      ) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to genre detail page.
        res.redirect(themachine.url);
      });
    }
  },
];
