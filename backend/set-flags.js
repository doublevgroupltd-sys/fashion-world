require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fashionworld')
  .then(async () => {
    // Make all products featured and made in Africa
    const r = await mongoose.connection.db.collection('products').updateMany(
      {},
      { $set: { featured: true, madeInAfrica: true } }
    );
    console.log(`Updated ${r.modifiedCount} products`);

    // Also set one product's category to "NEW IN" (pick any)
    const newIn = await mongoose.connection.db.collection('products').updateOne(
      { category: { $ne: 'NEW IN' } }, // first product that is not already NEW IN
      { $set: { category: 'NEW IN' } }
    );
    console.log('Set one product to NEW IN category');

    process.exit();
  })
  .catch(e => { console.error(e); process.exit(1); });