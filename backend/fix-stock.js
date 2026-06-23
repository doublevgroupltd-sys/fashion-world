require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fashionworld')
  .then(async () => {
    const r = await mongoose.connection.db.collection('products').updateMany({}, { $set: { totalStock: 50 } });
    console.log('totalStock updated:', r.modifiedCount);
    process.exit();
  })
  .catch(e => { console.error(e); process.exit(1); });
