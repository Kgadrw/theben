const mongoose = require('mongoose');

const aboutSchema = new mongoose.Schema({
  biography: {
    type: String,
    required: true,
    default: 'Born Benjamin Mugisha on January 9, 1987, "The Ben" is a prominent figure in the East African music scene. He has produced numerous popular songs, such as "Ndaje", "Ni Forever", and "Naremeye", and often collaborates with other African artists. He was recently awarded the "East Africa Best Act/Song" award at the Pipo Music Awards for his song "True Love". He and his wife, Uwicyeza Pamella, welcomed their first child in early 2025. The Ben is also preparing for a highly anticipated concert with fellow Rwandan artist Bruce Melodie in January 2026, which has generated significant buzz in the local entertainment industry.'
  },
  image: {
    type: String,
    default: '/theben.jfif'
  },
  title: {
    type: String,
    default: 'Biography'
  }
}, {
  timestamps: true
});

// Ensure only one about document exists
aboutSchema.statics.getAbout = async function() {
  let about = await this.findOne();
  if (!about) {
    about = await this.create({
      biography: 'Born Benjamin Mugisha on January 9, 1987, "The Ben" is a prominent figure in the East African music scene. He has produced numerous popular songs, such as "Ndaje", "Ni Forever", and "Naremeye", and often collaborates with other African artists. He was recently awarded the "East Africa Best Act/Song" award at the Pipo Music Awards for his song "True Love". He and his wife, Uwicyeza Pamella, welcomed their first child in early 2025. The Ben is also preparing for a highly anticipated concert with fellow Rwandan artist Bruce Melodie in January 2026, which has generated significant buzz in the local entertainment industry.',
      image: '/theben.jfif',
      title: 'Biography'
    });
  }
  return about;
};

aboutSchema.statics.updateAbout = async function(data) {
  let about = await this.findOne();
  if (!about) {
    about = await this.create(data);
  } else {
    Object.assign(about, data);
    await about.save();
  }
  return about;
};

module.exports = mongoose.models.About || mongoose.model('About', aboutSchema);

