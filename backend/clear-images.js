require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const r = await mongoose.connection.db.collection('products')
      .updateMany({}, { $set: { images: [] } });
    console.log('Cleared images for', r.modifiedCount, 'products');
    process.exit();
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });