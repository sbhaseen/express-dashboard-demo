const mongoose = require('mongoose');
const moment = require('moment');

const Schema = mongoose.Schema;

const MachineSchema = new Schema({
  name: { type: String, required: true, max: 100 },
  date_of_commissioning: { type: Date },
  date_of_retirement: { type: Date }
});

// Virtual for machine's URL
MachineSchema.virtual('url').get(function() {
  return '/dashboard/machine/' + this._id;
});

MachineSchema.virtual('lifespan').get(function() {
  let lifetime_string = '';
  if (this.date_of_commissioning) {
    lifetime_string = moment(this.date_of_commissioning).format(
      'MMMM Do, YYYY'
    );
  }
  lifetime_string += ' - ';
  if (this.date_of_retirement) {
    lifetime_string += moment(this.date_of_retirement).format('MMMM Do, YYYY');
  }
  return lifetime_string;
});

MachineSchema.virtual('date_of_commissioning_yyyy_mm_dd').get(function() {
  return moment(this.date_of_commissioning).format('YYYY-MM-DD');
});

MachineSchema.virtual('date_of_retirement_yyyy_mm_dd').get(function() {
  return moment(this.date_of_retirement).format('YYYY-MM-DD');
});

//Export model
module.exports = mongoose.model('Machine', MachineSchema);
