const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: { type: String, required: true, min: 3, max: 100 }
});

// Virtual for this category instance URL.
CategorySchema.virtual('url').get(function() {
  return '/dashboard/category/' + this._id;
});

// Export model.
module.exports = mongoose.model('Category', CategorySchema);
