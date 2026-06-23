require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fashionworld')
  .then(async () => {
    // Set totalStock to 50 for all products
    const result = await mongoose.connection.db.collection('products')
      .updateMany({}, { $set: { totalStock: 50 } });
    console.log('totalStock updated:', result.modifiedCount);
    process.exit();
  })
  .catch(e => { console.error(e); process.exit(1); });