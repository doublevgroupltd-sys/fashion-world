import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User';
import Product from './src/models/Product';
import Banner from './src/models/Banner';
import Order from './src/models/Order';

dotenv.config();

// Helper: generate URL-friendly slug from product name
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const UNSPLASH = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;

const banners = [
  {
    title: 'New Season, New You',
    subtitle: 'Discover the latest arrivals — luxury fashion curated for the modern African woman',
    image: UNSPLASH('1515886657613-9f3515b0c78f'),
    ctaText: 'Shop New In',
    ctaLink: '/shop?category=NEW IN',
    orderIndex: 0,
    backgroundColor: '#1a0a00',
    textColor: '#f5e6d3',
    isActive: true,
  },
  {
    title: 'Made in Africa',
    subtitle: 'Celebrate African craftsmanship — bold prints, rich textures, timeless elegance',
    image: UNSPLASH('1509631179647-0177331693ae'),
    ctaText: 'Explore Collection',
    ctaLink: '/shop?category=MADE IN AFRICA',
    orderIndex: 1,
    backgroundColor: '#2d1b0e',
    textColor: '#fef3e2',
    isActive: true,
  },
  {
    title: 'Luxury Footwear',
    subtitle: 'Step into confidence — premium sneakers and heels from top global brands',
    image: UNSPLASH('1542291026-7eec264c27ff'),
    ctaText: 'Shop Footwear',
    ctaLink: '/shop?category=FOOTWEAR',
    orderIndex: 2,
    backgroundColor: '#0d0d0d',
    textColor: '#ffffff',
    isActive: true,
  },
];

const products = [
  // WOMEN
  {
    name: 'Ankara Wrap Maxi Dress',
    description: 'Stunning floor-length wrap dress in authentic Ankara print. Features a deep V-neckline, adjustable waist tie, and vibrant geometric patterns. Perfect for formal events, garden parties, and cultural celebrations.',
    shortDescription: 'Floor-length wrap dress in authentic Ankara print',
    price: 4500,
    compareAtPrice: 6000,
    images: [UNSPLASH('1594938298870-e41f0ed4e3e2'), UNSPLASH('1515886657613-9f3515b0c78f')],
    category: 'WOMEN',
    brand: 'FashionAfrica',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Royal Blue Print', hex: '#1a4fa8' }, { name: 'Coral Print', hex: '#e8603c' }],
    totalStock: 45,
    madeInAfrica: true,
    featured: true,
    rating: 4.8,
    reviewCount: 124,
    soldCount: 312,
    tags: ['ankara', 'maxi', 'dress', 'african', 'formal'],
  },
  {
    name: 'Silk Slip Midi Dress',
    description: 'Elegant bias-cut midi dress in premium silk charmeuse. Minimalist silhouette with thin spaghetti straps, a subtle slit, and a fluid drape that flatters every body type.',
    shortDescription: 'Bias-cut midi dress in premium silk charmeuse',
    price: 8900,
    compareAtPrice: 12000,
    images: [UNSPLASH('1566479179817-c0a6ff21a89b'), UNSPLASH('1515886657613-9f3515b0c78f')],
    category: 'WOMEN',
    brand: 'Zara',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'Champagne', hex: '#f7e7ce' }, { name: 'Midnight Black', hex: '#1a1a1a' }],
    totalStock: 22,
    madeInAfrica: false,
    featured: true,
    rating: 4.9,
    reviewCount: 88,
    soldCount: 201,
    tags: ['silk', 'midi', 'elegant', 'evening'],
  },
  {
    name: 'High-Waist Wide Leg Trousers',
    description: 'Power dressing at its finest. These high-waisted wide-leg trousers are cut from premium ponte fabric, offering structure and stretch. Perfect for the boardroom or brunch.',
    shortDescription: 'High-waisted wide-leg trousers in ponte fabric',
    price: 3800,
    images: [UNSPLASH('1594938298870-e41f0ed4e3e2')],
    category: 'WOMEN',
    brand: 'Vivo Fashion',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Camel', hex: '#c19a6b' }, { name: 'Black', hex: '#000000' }, { name: 'Navy', hex: '#001f5b' }],
    totalStock: 38,
    madeInAfrica: false,
    featured: false,
    rating: 4.6,
    reviewCount: 55,
    soldCount: 140,
    tags: ['trousers', 'wide-leg', 'office', 'formal'],
  },
  {
    name: 'Kente Peplum Blazer',
    description: 'A bold statement piece for the modern African professional. Hand-woven Kente fabric strips accent the lapels and cuffs of this structured peplum blazer. Limited edition.',
    shortDescription: 'Structured blazer with hand-woven Kente accents',
    price: 12500,
    compareAtPrice: 16000,
    images: [UNSPLASH('1509631179647-0177331693ae')],
    category: 'WOMEN',
    brand: 'FashionAfrica',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'Black/Gold Kente', hex: '#1a1a1a' }],
    totalStock: 8,
    madeInAfrica: true,
    featured: true,
    rating: 5.0,
    reviewCount: 34,
    soldCount: 67,
    tags: ['kente', 'blazer', 'african', 'luxury', 'limited'],
  },
  // MEN
  {
    name: 'Linen Safari Suit',
    description: 'Master the art of smart-casual with this lightweight linen suit. Features a notch lapel jacket, two chest pockets, and matching straight-leg trousers. Ideal for warm-weather events.',
    shortDescription: 'Lightweight linen suit perfect for warm-weather events',
    price: 9500,
    compareAtPrice: 12000,
    images: [UNSPLASH('1594938298870-e41f0ed4e3e2')],
    category: 'MEN',
    brand: 'Hugo Boss',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Cream', hex: '#fffdd0' }, { name: 'Khaki', hex: '#c3b091' }],
    totalStock: 15,
    madeInAfrica: false,
    featured: true,
    rating: 4.7,
    reviewCount: 42,
    soldCount: 98,
    tags: ['suit', 'linen', 'formal', 'safari', 'men'],
  },
  {
    name: 'Dashiki Print Shirt',
    description: 'Classic dashiki shirt with embroidered V-neck collar in traditional West African patterns. Made from 100% cotton, breathable and comfortable for all-day wear.',
    shortDescription: 'Classic dashiki shirt in traditional West African patterns',
    price: 2800,
    images: [UNSPLASH('1489987707849-d5b4ae26e01d')],
    category: 'MEN',
    brand: 'AfriKing',
    sizes: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    colors: [{ name: 'Navy/Gold', hex: '#001f5b' }, { name: 'Green/Yellow', hex: '#2d5a27' }],
    totalStock: 60,
    madeInAfrica: true,
    featured: false,
    rating: 4.5,
    reviewCount: 89,
    soldCount: 245,
    tags: ['dashiki', 'african', 'casual', 'cotton'],
  },
  {
    name: 'Premium Slim Chinos',
    description: 'Versatile slim-fit chinos crafted from stretch twill fabric. Sits at the natural waist with a clean front, tapered leg, and discreet back pockets.',
    shortDescription: 'Slim-fit chinos in stretch twill fabric',
    price: 3200,
    images: [UNSPLASH('1542291026-7eec264c27ff')],
    category: 'MEN',
    brand: 'H&M',
    sizes: ['28', '30', '32', '34', '36', '38'],
    colors: [{ name: 'Olive', hex: '#708238' }, { name: 'Navy', hex: '#001f5b' }, { name: 'Stone', hex: '#b5a397' }],
    totalStock: 50,
    madeInAfrica: false,
    featured: false,
    rating: 4.4,
    reviewCount: 120,
    soldCount: 380,
    tags: ['chinos', 'slim', 'casual', 'versatile'],
  },
  // KIDS
  {
    name: 'Girls Ankara Party Dress',
    description: 'Let your little girl shine in this adorable Ankara print party dress. Features a pleated skirt, puffed sleeves, and a comfortable cotton lining. Machine washable.',
    shortDescription: 'Adorable Ankara print party dress with puffed sleeves',
    price: 1800,
    images: [UNSPLASH('1515886657613-9f3515b0c78f')],
    category: 'KIDS',
    brand: 'LittleFashion',
    sizes: ['2Y', '3Y', '4Y', '5Y', '6Y', '7Y', '8Y'],
    colors: [{ name: 'Bright Ankara Print', hex: '#e84393' }],
    totalStock: 35,
    madeInAfrica: true,
    featured: false,
    rating: 4.9,
    reviewCount: 67,
    soldCount: 189,
    tags: ['kids', 'girls', 'ankara', 'party', 'dress'],
  },
  {
    name: 'Boys Urban Tracksuit Set',
    description: 'Comfortable two-piece tracksuit set with zip-up hoodie and matching joggers. Made from soft cotton fleece with embroidered logo detail.',
    shortDescription: 'Soft cotton fleece tracksuit set',
    price: 2400,
    compareAtPrice: 3000,
    images: [UNSPLASH('1489987707849-d5b4ae26e01d')],
    category: 'KIDS',
    brand: 'Nike',
    sizes: ['4Y', '6Y', '8Y', '10Y', '12Y', '14Y'],
    colors: [{ name: 'Black/Red', hex: '#1a1a1a' }, { name: 'Navy/White', hex: '#001f5b' }],
    totalStock: 28,
    madeInAfrica: false,
    featured: false,
    rating: 4.6,
    reviewCount: 45,
    soldCount: 132,
    tags: ['kids', 'boys', 'tracksuit', 'sport', 'casual'],
  },
  // ACTIVEWEAR
  {
    name: 'High-Impact Sports Bra',
    description: 'Engineered for maximum support during high-impact workouts. Features double-layer front panel, wide adjustable straps, and moisture-wicking fabric. Impact rating 5/5.',
    shortDescription: 'Maximum-support sports bra for high-impact training',
    price: 2900,
    images: [UNSPLASH('1594938298870-e41f0ed4e3e2')],
    category: 'ACTIVEWEAR',
    brand: 'Under Armour',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'Electric Blue', hex: '#0066ff' }, { name: 'Hot Pink', hex: '#ff69b4' }, { name: 'Black', hex: '#000000' }],
    totalStock: 40,
    madeInAfrica: false,
    featured: true,
    rating: 4.8,
    reviewCount: 156,
    soldCount: 420,
    tags: ['sports bra', 'activewear', 'gym', 'high-impact'],
  },
  {
    name: 'Compression Leggings 7/8',
    description: 'Four-way stretch compression leggings with squat-proof technology. High waistband sculpts and supports. Moisture-wicking, breathable, with hidden pocket.',
    shortDescription: 'Squat-proof compression leggings with hidden pocket',
    price: 3500,
    compareAtPrice: 4200,
    images: [UNSPLASH('1566479179817-c0a6ff21a89b')],
    category: 'ACTIVEWEAR',
    brand: 'Gymshark',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Midnight Black', hex: '#1a1a1a' }, { name: 'Sage Green', hex: '#7d9c7d' }, { name: 'Dusty Rose', hex: '#d4a5a5' }],
    totalStock: 55,
    madeInAfrica: false,
    featured: true,
    rating: 4.9,
    reviewCount: 312,
    soldCount: 890,
    tags: ['leggings', 'compression', 'gym', 'yoga', 'running'],
  },
  // FOOTWEAR
  {
    name: 'Air Max Pulse Sneakers',
    description: 'Next-generation cushioning meets street-ready style. Bubble Air unit in the heel for visible cushioning, breathable mesh upper, and durable rubber outsole.',
    shortDescription: 'Next-gen cushioning sneakers with visible Air unit',
    price: 15000,
    images: [UNSPLASH('1542291026-7eec264c27ff')],
    category: 'FOOTWEAR',
    brand: 'Nike',
    sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
    colors: [{ name: 'White/Black', hex: '#ffffff' }, { name: 'University Red', hex: '#cc0000' }],
    totalStock: 20,
    madeInAfrica: false,
    featured: true,
    rating: 4.9,
    reviewCount: 234,
    soldCount: 567,
    tags: ['sneakers', 'nike', 'air max', 'running', 'lifestyle'],
  },
  {
    name: 'Block Heel Leather Mules',
    description: 'Effortlessly chic block-heel mules in genuine leather. 6cm heel height for comfortable elevation. Open-toe design with a padded insole for all-day wear.',
    shortDescription: 'Genuine leather block-heel mules with padded insole',
    price: 6800,
    compareAtPrice: 8500,
    images: [UNSPLASH('1515886657613-9f3515b0c78f')],
    category: 'FOOTWEAR',
    brand: 'Vivo Fashion',
    sizes: ['36', '37', '38', '39', '40', '41'],
    colors: [{ name: 'Nude Beige', hex: '#f5cba7' }, { name: 'Black', hex: '#000000' }, { name: 'Chocolate', hex: '#7b3f00' }],
    totalStock: 18,
    madeInAfrica: false,
    featured: false,
    rating: 4.6,
    reviewCount: 78,
    soldCount: 189,
    tags: ['mules', 'heels', 'leather', 'formal', 'office'],
  },
  {
    name: 'Maasai Beaded Sandals',
    description: 'Handcrafted in Kenya by Maasai artisans. Genuine cowhide leather soles with intricate hand-beaded straps in traditional Maasai patterns. Each pair is unique.',
    shortDescription: 'Handcrafted Kenyan sandals with Maasai beadwork',
    price: 4200,
    images: [UNSPLASH('1489987707849-d5b4ae26e01d')],
    category: 'FOOTWEAR',
    brand: 'MaasaiKraft',
    sizes: ['36', '37', '38', '39', '40', '41', '42'],
    colors: [{ name: 'Red/Blue Beads', hex: '#cc0000' }, { name: 'Multi-color', hex: '#ff6b35' }],
    totalStock: 12,
    madeInAfrica: true,
    featured: true,
    rating: 5.0,
    reviewCount: 56,
    soldCount: 134,
    tags: ['sandals', 'maasai', 'handcrafted', 'kenya', 'beaded'],
  },
  // ACCESSORIES
  {
    name: 'Leather Bucket Tote',
    description: 'Spacious bucket tote in full-grain vegetable-tanned leather. Unstructured silhouette with a drawstring closure, interior zip pocket, and detachable shoulder strap.',
    shortDescription: 'Full-grain vegetable-tanned leather bucket tote',
    price: 18000,
    images: [UNSPLASH('1594938298870-e41f0ed4e3e2')],
    category: 'ACCESSORIES',
    brand: 'FashionAfrica',
    sizes: ['One Size'],
    colors: [{ name: 'Tan', hex: '#d2b48c' }, { name: 'Black', hex: '#000000' }, { name: 'Burgundy', hex: '#800020' }],
    totalStock: 10,
    madeInAfrica: true,
    featured: true,
    rating: 4.9,
    reviewCount: 89,
    soldCount: 167,
    tags: ['tote', 'leather', 'bag', 'handbag', 'luxury'],
  },
  {
    name: 'Gold Plated Statement Earrings',
    description: '18k gold-plated statement drop earrings inspired by traditional Akuaba symbols. Lightweight resin fill with fine gold overlay. Hypoallergenic posts.',
    shortDescription: '18k gold-plated drop earrings with Akuaba design',
    price: 1500,
    compareAtPrice: 2200,
    images: [UNSPLASH('1566479179817-c0a6ff21a89b')],
    category: 'ACCESSORIES',
    brand: 'AfroBling',
    sizes: ['One Size'],
    colors: [{ name: '18k Gold', hex: '#d4af37' }],
    totalStock: 30,
    madeInAfrica: true,
    featured: false,
    rating: 4.7,
    reviewCount: 112,
    soldCount: 345,
    tags: ['earrings', 'gold', 'african', 'statement', 'jewelry'],
  },
  // BEAUTY
  {
    name: 'Shea Butter Glow Body Oil',
    description: '100% organic cold-pressed shea butter enriched with baobab, marula, and vitamin E oils. Absorbs quickly, leaves skin luminous and deeply nourished. Suitable for all skin tones.',
    shortDescription: 'Organic shea butter body oil with baobab and marula',
    price: 2200,
    images: [UNSPLASH('1515886657613-9f3515b0c78f')],
    category: 'BEAUTY',
    brand: 'NaturAfrica',
    sizes: ['100ml', '200ml'],
    colors: [{ name: 'Amber Gold', hex: '#d4a017' }],
    totalStock: 45,
    madeInAfrica: true,
    featured: true,
    rating: 4.8,
    reviewCount: 201,
    soldCount: 567,
    tags: ['beauty', 'body oil', 'shea butter', 'organic', 'skincare'],
  },
  {
    name: 'Afrocentric Eyeshadow Palette',
    description: '16 richly pigmented shades inspired by the colors of the African sunset. From earthy terracottas and golden ochres to deep plums and burnt oranges.',
    shortDescription: '16-shade palette inspired by African sunsets',
    price: 3800,
    images: [UNSPLASH('1509631179647-0177331693ae')],
    category: 'BEAUTY',
    brand: 'GlowAfrica',
    sizes: ['Standard'],
    colors: [{ name: 'Sunset Palette', hex: '#ff6b35' }],
    totalStock: 25,
    madeInAfrica: false,
    featured: false,
    rating: 4.6,
    reviewCount: 88,
    soldCount: 234,
    tags: ['eyeshadow', 'makeup', 'palette', 'beauty', 'pigmented'],
  },
  // MADE IN AFRICA
  {
    name: 'Kanga Print Caftan',
    description: 'Flowing full-length caftan in authentic East African kanga print. Hand-hemmed with gold thread, featuring traditional Swahili proverb border. One-size-fits-most silhouette.',
    shortDescription: 'Flowing caftan in authentic East African kanga print',
    price: 3200,
    images: [UNSPLASH('1594938298870-e41f0ed4e3e2')],
    category: 'MADE IN AFRICA',
    brand: 'SwahiliStyle',
    sizes: ['One Size', 'Plus'],
    colors: [{ name: 'Ocean Blue Print', hex: '#006994' }, { name: 'Sunset Orange', hex: '#fd5e53' }],
    totalStock: 20,
    madeInAfrica: true,
    featured: true,
    rating: 4.9,
    reviewCount: 76,
    soldCount: 198,
    tags: ['kanga', 'caftan', 'swahili', 'east africa', 'print'],
  },
  {
    name: 'Handwoven Sisal Clutch',
    description: 'Artisan-crafted sisal clutch bag woven by women cooperatives in Nairobi. Natural sisal fiber with leather trim, magnetic clasp, and fabric lining.',
    shortDescription: 'Artisan-crafted sisal clutch by Nairobi women cooperatives',
    price: 2800,
    images: [UNSPLASH('1566479179817-c0a6ff21a89b')],
    category: 'MADE IN AFRICA',
    brand: 'NairobiCraft',
    sizes: ['One Size'],
    colors: [{ name: 'Natural Sisal', hex: '#c8b560' }, { name: 'Black Trim', hex: '#2c2c2c' }],
    totalStock: 15,
    madeInAfrica: true,
    featured: false,
    rating: 4.8,
    reviewCount: 43,
    soldCount: 89,
    tags: ['sisal', 'clutch', 'handwoven', 'nairobi', 'artisan'],
  },
  // SALE
  {
    name: 'Floral Wrap Skirt',
    description: 'Flowy midi wrap skirt in tropical floral print. Adjustable tie waist, full lining, and silky finish. Was one of our top sellers last season.',
    shortDescription: 'Flowy midi wrap skirt in tropical floral print',
    price: 1200,
    compareAtPrice: 3500,
    images: [UNSPLASH('1515886657613-9f3515b0c78f')],
    category: 'SALE',
    brand: 'Zara',
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [{ name: 'Tropical Floral', hex: '#ff6b9d' }],
    totalStock: 8,
    madeInAfrica: false,
    featured: false,
    rating: 4.3,
    reviewCount: 55,
    soldCount: 312,
    tags: ['skirt', 'floral', 'sale', 'midi', 'wrap'],
  },
  // BUDGET FRIENDLY
  {
    name: 'Basic Tee 3-Pack',
    description: 'Premium combed cotton essential tees in three neutral shades. Crew neck, regular fit, pre-shrunk. The wardrobe foundation you need.',
    shortDescription: '3-pack premium combed cotton crew neck tees',
    price: 1500,
    images: [UNSPLASH('1489987707849-d5b4ae26e01d')],
    category: 'BUDGET FRIENDLY',
    brand: 'H&M',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'White/Grey/Black', hex: '#808080' }],
    totalStock: 80,
    madeInAfrica: false,
    featured: false,
    rating: 4.2,
    reviewCount: 234,
    soldCount: 890,
    tags: ['basic', 'tee', 'cotton', 'essentials', 'affordable'],
  },
  {
    name: 'Canvas Tote Bag',
    description: 'Durable 12oz canvas tote with reinforced handles and a spacious main compartment. Inner zip pocket. Minimalist "FashionWorld" embroidery.',
    shortDescription: 'Durable canvas tote with inner zip pocket',
    price: 850,
    images: [UNSPLASH('1594938298870-e41f0ed4e3e2')],
    category: 'BUDGET FRIENDLY',
    brand: 'FashionWorld',
    sizes: ['One Size'],
    colors: [{ name: 'Natural Canvas', hex: '#f5f0e8' }, { name: 'Black', hex: '#1a1a1a' }],
    totalStock: 100,
    madeInAfrica: false,
    featured: false,
    rating: 4.4,
    reviewCount: 189,
    soldCount: 672,
    tags: ['tote', 'canvas', 'bag', 'affordable', 'everyday'],
  },
  // NEW IN
  {
    name: 'Satin Cargo Trousers',
    description: 'The latest trend collision: utility meets luxury. Satin-finish cargo trousers with four functional pockets, elasticated waist, and a tapered leg. SS25 collection.',
    shortDescription: 'SS25 satin-finish cargo trousers with functional pockets',
    price: 5800,
    images: [UNSPLASH('1566479179817-c0a6ff21a89b')],
    category: 'NEW IN',
    brand: 'Vivo Fashion',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'Silver Satin', hex: '#c0c0c0' }, { name: 'Gold Satin', hex: '#d4af37' }, { name: 'Champagne', hex: '#f7e7ce' }],
    totalStock: 18,
    madeInAfrica: false,
    featured: true,
    rating: 4.7,
    reviewCount: 28,
    soldCount: 45,
    tags: ['cargo', 'satin', 'trousers', 'new', 'trend'],
  },
];

const users = [
  // Consumers
  { firstName: 'Alice', lastName: 'Wanjiku', email: 'alice@example.com', password: 'Password123', role: 'consumer', phone: '+254712345678' },
  { firstName: 'Bob', lastName: 'Odhiambo', email: 'bob@example.com', password: 'Password123', role: 'consumer', phone: '+254723456789' },
  { firstName: 'Carol', lastName: 'Muthoni', email: 'carol@example.com', password: 'Password123', role: 'consumer', phone: '+254734567890' },
  { firstName: 'David', lastName: 'Kamau', email: 'david@example.com', password: 'Password123', role: 'consumer', phone: '+254745678901' },
  { firstName: 'Eva', lastName: 'Achieng', email: 'eva@example.com', password: 'Password123', role: 'consumer', phone: '+254756789012' },
  // Agents
  { firstName: 'Admin', lastName: 'FashionWorld', email: 'admin@fashionworld.com', password: 'Admin123!', role: 'agent', phone: '+254700000001' },
  { firstName: 'Janet', lastName: 'Manager', email: 'manager@fashionworld.com', password: 'Admin123!', role: 'agent', phone: '+254700000002' },
  { firstName: 'Mike', lastName: 'Operations', email: 'ops@fashionworld.com', password: 'Admin123!', role: 'agent', phone: '+254700000003' },
  { firstName: 'Sarah', lastName: 'Marketing', email: 'marketing@fashionworld.com', password: 'Admin123!', role: 'agent', phone: '+254700000004' },
  { firstName: 'Tom', lastName: 'Support', email: 'support@fashionworld.com', password: 'Admin123!', role: 'agent', phone: '+254700000005' },
];

async function seed() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fashionworld';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Banner.deleteMany({}),
      Order.deleteMany({}),
    ]);
    console.log('🧹 Cleared existing data');

    // Seed users
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Seed banners
    await Banner.insertMany(banners);
    console.log(`✅ Created ${banners.length} banners`);

    // --- FIX: Add slug to each product before inserting ---
    const productsWithSlug = products.map(product => ({
      ...product,
      slug: slugify(product.name),
    }));

    // Seed products
    const createdProducts = await Product.insertMany(productsWithSlug);
    console.log(`✅ Created ${createdProducts.length} products`);

    // Seed sample orders with unique order numbers
    const consumers = createdUsers.filter(u => u.role === 'consumer');
    const timestamp = Date.now();
    const sampleOrders = consumers.slice(0, 3).map((consumer, i) => ({
      orderNumber: `ORD-${timestamp}-${i + 1}`,   // unique order number
      customer: consumer._id,
      items: [
        {
          product: createdProducts[i * 2]._id,
          name: createdProducts[i * 2].name,
          image: createdProducts[i * 2].images[0],
          price: createdProducts[i * 2].price,
          quantity: 1,
          subtotal: createdProducts[i * 2].price,
        },
      ],
      shippingAddress: {
        firstName: consumer.firstName,
        lastName: consumer.lastName,
        phone: consumer.phone || '+254700000000',
        email: consumer.email,
        street: `${i + 1} Kimathi Street`,
        city: 'Nairobi',
        county: 'Nairobi',
        country: 'Kenya',
      },
      paymentMethod: ['mpesa', 'card', 'cod'][i] as any,
      paymentStatus: ['paid', 'paid', 'pending'][i] as any,
      status: ['delivered', 'confirmed', 'pending'][i] as any,
      subtotal: createdProducts[i * 2].price,
      shippingCost: 0,
      tax: Math.round(createdProducts[i * 2].price * 0.16),
      total: Math.round(createdProducts[i * 2].price * 1.16),
    }));

    await Order.insertMany(sampleOrders);
    console.log(`✅ Created ${sampleOrders.length} sample orders`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('   Consumer: alice@example.com / Password123');
    console.log('   Agent:    admin@fashionworld.com / Admin123!');
    console.log('   Agent Invite Code: AGENT2026\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();