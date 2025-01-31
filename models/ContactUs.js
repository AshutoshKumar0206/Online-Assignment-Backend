const mongoose = require('mongoose');

const ContactUsSchema = new mongoose.Schema({
name: {
  type: String,
  required: true,
},
email: {
   type: String,
   required: true,
   unique: true,
},
feedback: [{
   type: String,
   required: true,
}],
});

module.exports = mongoose.model('contactUs', ContactUsSchema);
