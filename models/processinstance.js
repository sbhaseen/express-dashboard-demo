var moment = require('moment');
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ProcessInstanceSchema = new Schema(
  {
    process: { type: Schema.Types.ObjectId, ref: 'Process', required: true }, //reference to the associated process
    operator: {type: String, required: true},
    status: {type: String, required: true, enum: ['Scheduled', 'Started', 'Finished'], default: 'Scheduled'},
    scheduled_end: {type: Date, default: Date.now}
  }
);

// Virtual for processinstance's URL
ProcessInstanceSchema
.virtual('url')
.get(function () {
  return '/dashboard/processinstance/' + this._id;
});

ProcessInstanceSchema
.virtual('scheduled_end_formatted')
.get(function () {
  return moment(this.scheduled_end).format('MMMM Do, YYYY');
});

ProcessInstanceSchema
.virtual('scheduled_end_yyyy_mm_dd')
.get(function () {
  return moment(this.scheduled_end).format('YYYY-MM-DD');
});

//Export model
module.exports = mongoose.model('ProcessInstance', ProcessInstanceSchema);