const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ProcessSchema = new Schema({
  name: { type: String, required: true },
  machine: { type: Schema.Types.ObjectId, ref: 'Machine', required: true },
  summary: { type: String, required: true },
  serial_number: { type: String, required: true },
  category: [{ type: Schema.Types.ObjectId, ref: 'Category' }]
});

// Virtual for process's URL
ProcessSchema.virtual('url').get(function() {
  return '/dashboard/process/' + this._id;
});

//Export model
module.exports = mongoose.model('Process', ProcessSchema);
