/* global process */
import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'productslog';
const COLLECTION_NAME = 'products';
const JWT_SECRET = process.env.JWT_SECRET || 'luxe_liquid_secret_key_123456';

app.use(cors());
app.use(express.json());

let db;
let dbLogin;
let client;

// Connect to MongoDB
async function connectToMongo() {
  try {
    client = await MongoClient.connect(MONGO_URI);
    db = client.db(DB_NAME);
    dbLogin = client.db('login');
    console.log(`Connected successfully to database: ${DB_NAME}`);
    console.log(`Connected successfully to database: login`);
    
    // Seed default admin/user if collections are empty
    await seedDefaultAccounts();
    // Seed default press quotes
    await seedDefaultPress();
  } catch (err) {
    console.error('Failed to connect to MongoDB, retrying in 5 seconds...', err.message);
    setTimeout(connectToMongo, 5000);
  }
}

// Seeding function for testing authentication out of the box
async function seedDefaultAccounts() {
  try {
    const usersCol = dbLogin.collection('users');
    const adminCol = dbLogin.collection('admin');

    const userCount = await usersCol.countDocuments();
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash('user123', 10);
      await usersCol.insertOne({
        email: 'user@luxe.com',
        password: hashedPassword,
        createdAt: new Date()
      });
      console.log('Seeded default user account: user@luxe.com / user123');
    }

    const adminCount = await adminCol.countDocuments();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await adminCol.insertOne({
        email: 'admin@luxe.com',
        password: hashedPassword,
        createdAt: new Date()
      });
      console.log('Seeded default admin account: admin@luxe.com / admin123');
    }
  } catch (err) {
    console.error('Seeding failed:', err.message);
  }
}

// Seed default press quotes
async function seedDefaultPress() {
  try {
    const pressCol = db.collection('press');
    const count = await pressCol.countDocuments();
    if (count === 0) {
      const defaultPress = [
        { source: "The Glass Chronicle", quote: "A masterclass in modern digital retail. Luxe Liquid turns online shopping into an art gallery experience." },
        { source: "The Liquid Digest", quote: "The 'Liquid Glass' UI framework uses backdrop blur and depth layers in a way that feels organic and highly tactile." },
        { source: "The Velvet Gazette", quote: "Curated goods meets high-fashion web design. This is where refinement lives." },
        { source: "The Refined Herald", quote: "Redefining the digital shopping experience for high-end consumers through quiet luxury." }
      ];
      await pressCol.insertMany(defaultPress);
      console.log('Seeded default press quotes.');
    }
  } catch (err) {
    console.error('Press seeding failed:', err.message);
  }
}

connectToMongo();

// Helper to retrieve products list (handling both flattened documents and single nested-array documents)
async function getAllProducts() {
  if (!db) return [];
  const collection = db.collection(COLLECTION_NAME);
  
  // Check if collection has a single document containing a 'products' array
  const count = await collection.countDocuments();
  if (count === 1) {
    const singleDoc = await collection.findOne();
    if (singleDoc && Array.isArray(singleDoc.products)) {
      return singleDoc.products;
    }
  }
  
  // Otherwise, assume each document is a product
  return await collection.find({}).toArray();
}

// 1. Get products (with optional search query '?q=...')
app.get('/api/products', async (req, res) => {
  try {
    const query = req.query.q || '';
    const products = await getAllProducts();
    
    if (query.trim().length > 0) {
      const lowerQuery = query.toLowerCase();
      const filtered = products.filter(product => 
        (product.title && product.title.toLowerCase().includes(lowerQuery)) ||
        (product.description && product.description.toLowerCase().includes(lowerQuery)) ||
        (product.category && product.category.toLowerCase().includes(lowerQuery)) ||
        (product.brand && product.brand.toLowerCase().includes(lowerQuery))
      );
      return res.json({ products: filtered });
    }
    
    // Return first 9 products if no query (replaces default dummyjson limit)
    res.json({ products: products.slice(0, 9) });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Get products by category
app.get('/api/products/category/:category', async (req, res) => {
  try {
    const categoryName = req.params.category.toLowerCase();
    const products = await getAllProducts();
    const filtered = products.filter(product => {
      const cat = (product.category || '').toLowerCase();
      // Handle custom collections logic on backend to match front-end:
      // 'tech' maps to laptops/smartphones, 'makeup' maps to beauty/fragrances, etc.
      if (categoryName === 'laptops') {
        return ['smartphones', 'laptops', 'tablets', 'mobile-accessories', 'electronics', 'laptops-and-computers', 'tech'].includes(cat);
      }
      if (categoryName === 'beauty') {
        return ['beauty', 'fragrances', 'skin-care', 'cosmetics', 'face-cream'].includes(cat);
      }
      if (categoryName === 'groceries') {
        return cat === 'groceries';
      }
      return cat === categoryName;
    });
    res.json({ products: filtered });
  } catch (err) {
    console.error('Error fetching by category:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Get single product details by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const products = await getAllProducts();
    const product = products.find(p => Number(p.id) === targetId);
    
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (err) {
    console.error('Error fetching single product:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Checkout endpoint to update product stocks and availability status in MongoDB
app.post('/api/checkout', async (req, res) => {
  try {
    const { items, email } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid checkout request data' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const collection = db.collection(COLLECTION_NAME);
    const count = await collection.countDocuments();
    const isSingleDoc = (count === 1);

    const products = await getAllProducts();

    let totalPrice = 0;
    const checkoutDetails = [];

    for (const item of items) {
      const productId = Number(item.id);
      const qty = Number(item.quantity);

      const product = products.find(p => Number(p.id) === productId);
      if (product) {
        const currentStock = Number(product.stock || 0);
        const newStock = Math.max(0, currentStock - qty);
        const status = newStock === 0 ? 'Out of Stock' : 'In Stock';

        // Calculate pricing details for order analytics
        const price = Number(product.price);
        const discount = Number(product.discountPercentage || 0);
        const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
        totalPrice += finalPrice * qty;
        checkoutDetails.push({
          id: product.id,
          title: product.title,
          price: Number(finalPrice.toFixed(2)),
          quantity: qty
        });

        if (isSingleDoc) {
          // Scenario A: Single document with nested 'products' array
          await collection.updateOne(
            { "products.id": productId },
            { 
              $set: { 
                "products.$.stock": newStock, 
                "products.$.availabilityStatus": status 
              } 
            }
          );
        } else {
          // Scenario B: Individual documents per product
          await collection.updateOne(
            { id: productId },
            { 
              $set: { 
                stock: newStock, 
                availabilityStatus: status 
              } 
            }
          );
        }
      }
    }

    // Log the transaction in checkout_logs
    const buyerEmail = email || 'anonymous@luxe.com';
    const logEntry = {
      email: buyerEmail,
      items: checkoutDetails,
      totalPrice: Number(totalPrice.toFixed(2)),
      date: new Date()
    };
    await db.collection('checkout_logs').insertOne(logEntry);

    // Update user accounts total purchased and clear user cart
    if (email && dbLogin) {
      const emailRegex = { $regex: new RegExp(`^${email}$`, 'i') };
      const totalQty = items.reduce((acc, i) => acc + Number(i.quantity), 0);
      
      await dbLogin.collection('users').updateOne(
        { email: emailRegex },
        { $inc: { totalPurchased: totalQty } }
      );
      await dbLogin.collection('admin').updateOne(
        { email: emailRegex },
        { $inc: { totalPurchased: totalQty } }
      );
      
      // Clear saved active cart
      await db.collection('carts').deleteOne({ email: emailRegex });
    }

    res.json({ success: true, message: 'Checkout processed and stocks updated successfully.' });
  } catch (err) {
    console.error('Error processing checkout:', err);
    res.status(500).json({ error: 'Failed to process checkout' });
  }
});

// 5. Restock endpoint to add items back to product stock and update availability status
app.post('/api/products/:id/restock', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { quantity } = req.body;
    const addQty = Number(quantity);

    if (isNaN(addQty) || addQty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const collection = db.collection(COLLECTION_NAME);
    const count = await collection.countDocuments();
    const isSingleDoc = (count === 1);

    const products = await getAllProducts();
    const product = products.find(p => Number(p.id) === productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const currentStock = Number(product.stock || 0);
    const newStock = currentStock + addQty;
    const status = newStock > 0 ? 'In Stock' : 'Out of Stock';

    if (isSingleDoc) {
      await collection.updateOne(
        { "products.id": productId },
        { 
          $set: { 
            "products.$.stock": newStock, 
            "products.$.availabilityStatus": status 
          } 
        }
      );
    } else {
      await collection.updateOne(
        { id: productId },
        { 
          $set: { 
            stock: newStock, 
            availabilityStatus: status 
          } 
        }
      );
    }

    res.json({ 
      success: true, 
      message: 'Product restocked successfully.', 
      newStock, 
      availabilityStatus: status 
    });
  } catch (err) {
    console.error('Error restocking product:', err);
    res.status(500).json({ error: 'Failed to restock product' });
  }
});

// 6. Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    if (!dbLogin) {
      return res.status(500).json({ error: 'Authentication database not connected' });
    }

    const collectionName = role === 'admin' ? 'admin' : 'users';
    const collection = dbLogin.collection(collectionName);

    // Find account by email (case-insensitive)
    const account = await collection.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (!account) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password (supporting both hashed bcrypt and fallback plaintext)
    let isMatch = false;
    if (account.password.startsWith('$2a$') || account.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, account.password);
    } else {
      isMatch = (password === account.password);
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update lastLogin timestamp in database
    await collection.updateOne({ _id: account._id }, { $set: { lastLogin: new Date() } });

    // Generate JWT token
    const token = jwt.sign(
      { id: account._id, email: account.email, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        email: account.email,
        role
      }
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 7. Session Verification Endpoint
app.get('/api/auth/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      success: true,
      user: {
        email: decoded.email,
        role: decoded.role
      }
    });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// 7b. User Registration Endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    if (!dbLogin) {
      return res.status(500).json({ error: 'Authentication database not connected' });
    }

    const emailRegex = { $regex: new RegExp(`^${email}$`, 'i') };

    // Check if email already exists in users or admin
    const userExists = await dbLogin.collection('users').findOne({ email: emailRegex });
    const adminExists = await dbLogin.collection('admin').findOne({ email: emailRegex });

    if (userExists || adminExists) {
      return res.status(400).json({ error: 'Email address is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'user',
      totalPurchased: 0,
      lastLogin: new Date(),
      createdAt: new Date()
    };

    const result = await dbLogin.collection('users').insertOne(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertedId, email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        email,
        role: 'user'
      }
    });
  } catch (err) {
    console.error('Error in registration:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- ADMIN & MANAGEMENT ENDPOINTS ---

// A. Product CRUD - Create
app.post('/api/products', async (req, res) => {
  try {
    const { title, description, price, discountPercentage, stock, tags, brand, category } = req.body;
    if (!title || price === undefined || stock === undefined || !category) {
      return res.status(400).json({ error: 'Title, price, stock, and category are required' });
    }
    
    const collection = db.collection(COLLECTION_NAME);
    const products = await getAllProducts();
    
    const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    
    const newProduct = {
      id: nextId,
      title,
      description: description || '',
      price: Number(price),
      discountPercentage: Number(discountPercentage || 0),
      rating: 5.0,
      stock: Number(stock),
      availabilityStatus: Number(stock) > 0 ? 'In Stock' : 'Out of Stock',
      tags: Array.isArray(tags) ? tags : [],
      brand: brand || '',
      category: category,
      thumbnail: 'https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/thumbnail.png',
      images: ['https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.png'],
      reviews: []
    };
    
    const count = await collection.countDocuments();
    if (count === 1) {
      await collection.updateOne({}, { $push: { products: newProduct } });
    } else {
      await collection.insertOne(newProduct);
    }
    
    res.json({ success: true, product: newProduct });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// B. Product CRUD - Update
app.put('/api/products/:id', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { title, description, price, discountPercentage, stock, tags, brand, category } = req.body;
    
    const collection = db.collection(COLLECTION_NAME);
    const products = await getAllProducts();
    const product = products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const updatedFields = {};
    if (title !== undefined) updatedFields.title = title;
    if (description !== undefined) updatedFields.description = description;
    if (price !== undefined) updatedFields.price = Number(price);
    if (discountPercentage !== undefined) updatedFields.discountPercentage = Number(discountPercentage);
    if (stock !== undefined) {
      updatedFields.stock = Number(stock);
      updatedFields.availabilityStatus = Number(stock) > 0 ? 'In Stock' : 'Out of Stock';
    }
    if (tags !== undefined) updatedFields.tags = Array.isArray(tags) ? tags : [];
    if (brand !== undefined) updatedFields.brand = brand;
    if (category !== undefined) updatedFields.category = category;
    
    const count = await collection.countDocuments();
    if (count === 1) {
      const updateObj = {};
      for (const [key, value] of Object.entries(updatedFields)) {
        updateObj[`products.$.${key}`] = value;
      }
      await collection.updateOne({ "products.id": productId }, { $set: updateObj });
    } else {
      await collection.updateOne({ id: productId }, { $set: updatedFields });
    }
    
    res.json({ success: true, message: 'Product updated successfully' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// C. Product CRUD - Delete
app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const collection = db.collection(COLLECTION_NAME);
    
    const count = await collection.countDocuments();
    if (count === 1) {
      await collection.updateOne({}, { $pull: { products: { id: productId } } });
    } else {
      const result = await collection.deleteOne({ id: productId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
    }
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// D. Critique - Update review verification/hidden status
app.put('/api/products/:productId/reviews/:idx', async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const idx = Number(req.params.idx);
    const { verified, hidden } = req.body;
    
    const collection = db.collection(COLLECTION_NAME);
    const products = await getAllProducts();
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = products[productIndex];
    if (!product.reviews || !product.reviews[idx]) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    if (verified !== undefined) {
      product.reviews[idx].verified = verified;
    }
    if (hidden !== undefined) {
      product.reviews[idx].hidden = hidden;
    }
    
    const count = await collection.countDocuments();
    if (count === 1) {
      await collection.updateOne(
        { "products.id": productId },
        { $set: { [`products.$.reviews`]: product.reviews } }
      );
    } else {
      await collection.updateOne(
        { id: productId },
        { $set: { reviews: product.reviews } }
      );
    }
    
    res.json({ success: true, message: 'Review updated successfully', reviews: product.reviews });
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// D2. Critique - Add review to a product
app.post('/api/products/:id/reviews', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { rating, comment, reviewerName, reviewerEmail } = req.body;
    
    if (rating === undefined || !reviewerName || !reviewerEmail) {
      return res.status(400).json({ error: 'Rating, reviewerName, and reviewerEmail are required' });
    }
    
    const collection = db.collection(COLLECTION_NAME);
    const products = await getAllProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const newReview = {
      rating: Number(rating),
      comment: comment || '',
      date: new Date().toISOString(),
      reviewerName,
      reviewerEmail,
      verified: false,
      hidden: false
    };
    
    if (!product.reviews) {
      product.reviews = [];
    }
    product.reviews.push(newReview);
    
    const totalRating = product.reviews.reduce((acc, r) => acc + r.rating, 0);
    const newAvgRating = Number((totalRating / product.reviews.length).toFixed(2));
    
    const count = await collection.countDocuments();
    if (count === 1) {
      await collection.updateOne(
        { "products.id": productId },
        { 
          $set: { 
            "products.$.reviews": product.reviews,
            "products.$.rating": newAvgRating
          } 
        }
      );
    } else {
      await collection.updateOne(
        { id: productId },
        { 
          $set: { 
            reviews: product.reviews,
            rating: newAvgRating
          } 
        }
      );
    }
    
    res.json({ success: true, message: 'Review added successfully', reviews: product.reviews, rating: newAvgRating });
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// D3. Critique - Delete review from a product
app.delete('/api/products/:productId/reviews/:idx', async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const idx = Number(req.params.idx);
    
    const collection = db.collection(COLLECTION_NAME);
    const products = await getAllProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (!product.reviews || !product.reviews[idx]) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    product.reviews.splice(idx, 1);
    
    const newAvgRating = product.reviews.length > 0
      ? Number((product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length).toFixed(2))
      : 5.0;
      
    const count = await collection.countDocuments();
    if (count === 1) {
      await collection.updateOne(
        { "products.id": productId },
        { 
          $set: { 
            "products.$.reviews": product.reviews,
            "products.$.rating": newAvgRating
          } 
        }
      );
    } else {
      await collection.updateOne(
        { id: productId },
        { 
          $set: { 
            reviews: product.reviews,
            rating: newAvgRating
          } 
        }
      );
    }
    
    res.json({ success: true, message: 'Review deleted successfully', reviews: product.reviews, rating: newAvgRating });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});


// E. Critique - Dynamic Press Quotes endpoints
app.get('/api/editorial/press', async (req, res) => {
  try {
    const pressCol = db.collection('press');
    const quotes = await pressCol.find({}).toArray();
    res.json({ quotes });
  } catch (err) {
    console.error('Error fetching press quotes:', err);
    res.status(500).json({ error: 'Failed to fetch press quotes' });
  }
});

app.post('/api/editorial/press', async (req, res) => {
  try {
    const { source, quote } = req.body;
    if (!source || !quote) {
      return res.status(400).json({ error: 'Source and quote content are required' });
    }
    const pressCol = db.collection('press');
    const newQuote = { source, quote };
    const result = await pressCol.insertOne(newQuote);
    res.json({ success: true, quote: { ...newQuote, _id: result.insertedId } });
  } catch (err) {
    console.error('Error adding press quote:', err);
    res.status(500).json({ error: 'Failed to add press quote' });
  }
});

app.delete('/api/editorial/press/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const pressCol = db.collection('press');
    await pressCol.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true, message: 'Press quote deleted successfully' });
  } catch (err) {
    console.error('Error deleting press quote:', err);
    res.status(500).json({ error: 'Failed to delete press quote' });
  }
});

// F. Cart Abandonment Updates
app.post('/api/cart', async (req, res) => {
  try {
    const { email, items } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    const cartsCol = db.collection('carts');
    if (!items || items.length === 0) {
      await cartsCol.deleteOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    } else {
      await cartsCol.updateOne(
        { email: { $regex: new RegExp(`^${email}$`, 'i') } },
        { $set: { email, items, updatedAt: new Date() } },
        { upsert: true }
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating cart:', err);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

app.get('/api/analytics/abandonment', async (req, res) => {
  try {
    const currentEmail = req.query.email || '';
    const cartsCol = db.collection('carts');
    
    const query = currentEmail 
      ? { email: { $not: new RegExp(`^${currentEmail}$`, 'i') } } 
      : {};
      
    const carts = await cartsCol.find(query).toArray();
    res.json({ carts });
  } catch (err) {
    console.error('Error fetching abandonment stats:', err);
    res.status(500).json({ error: 'Failed to fetch abandonment stats' });
  }
});

// G. Sales & Revenue Analytics Dashboard
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const logsCol = db.collection('checkout_logs');
    const logs = await logsCol.find({}).sort({ date: -1 }).toArray();
    
    let totalRevenue = 0;
    logs.forEach(log => {
      totalRevenue += Number(log.totalPrice || 0);
    });
    
    const avgOrderValue = logs.length > 0 ? (totalRevenue / logs.length) : 0;
    
    const products = await getAllProducts();
    const categoryRevenue = {};
    
    logs.forEach(log => {
      if (Array.isArray(log.items)) {
        log.items.forEach(item => {
          const product = products.find(p => p.id === item.id);
          const category = product ? (product.category || 'other') : 'other';
          categoryRevenue[category] = (categoryRevenue[category] || 0) + (Number(item.price) * Number(item.quantity));
        });
      }
    });
    
    res.json({
      totalRevenue: Number(totalRevenue.toFixed(2)),
      avgOrderValue: Number(avgOrderValue.toFixed(2)),
      totalOrders: logs.length,
      categoryRevenue,
      logs
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// H. User Account Management
app.get('/api/accounts', async (req, res) => {
  try {
    if (!dbLogin) return res.status(500).json({ error: 'Auth database not connected' });
    
    const users = await dbLogin.collection('users').find({}).toArray();
    const admins = await dbLogin.collection('admin').find({}).toArray();
    
    const formattedUsers = users.map(u => ({ 
      id: u._id, 
      email: u.email, 
      role: 'user', 
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      lastLogin: u.lastLogin || null, 
      totalPurchased: u.totalPurchased || 0 
    }));
    
    const formattedAdmins = admins.map(a => ({ 
      id: a._id, 
      email: a.email, 
      role: 'admin', 
      firstName: a.firstName || '',
      lastName: a.lastName || '',
      lastLogin: a.lastLogin || null, 
      totalPurchased: a.totalPurchased || 0 
    }));
    
    res.json({ accounts: [...formattedUsers, ...formattedAdmins] });
  } catch (err) {
    console.error('Error listing accounts:', err);
    res.status(500).json({ error: 'Failed to list accounts' });
  }
});

app.put('/api/accounts/:email/role', async (req, res) => {
  try {
    const targetEmail = req.params.email;
    const { role } = req.body;
    
    if (!dbLogin) return res.status(500).json({ error: 'Auth database not connected' });
    if (role !== 'admin' && role !== 'user') {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    const emailRegex = { $regex: new RegExp(`^${targetEmail}$`, 'i') };
    
    if (role === 'admin') {
      const userDoc = await dbLogin.collection('users').findOne({ email: emailRegex });
      if (!userDoc) {
        return res.status(404).json({ error: 'User account not found' });
      }
      
      await dbLogin.collection('admin').insertOne({
        email: userDoc.email,
        password: userDoc.password,
        firstName: userDoc.firstName || '',
        lastName: userDoc.lastName || '',
        lastLogin: userDoc.lastLogin || null,
        totalPurchased: userDoc.totalPurchased || 0,
        createdAt: userDoc.createdAt || new Date()
      });
      
      await dbLogin.collection('users').deleteOne({ email: emailRegex });
    } else {
      const adminDoc = await dbLogin.collection('admin').findOne({ email: emailRegex });
      if (!adminDoc) {
        return res.status(404).json({ error: 'Admin account not found' });
      }
      
      const adminCount = await dbLogin.collection('admin').countDocuments();
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last remaining administrator.' });
      }
      
      await dbLogin.collection('users').insertOne({
        email: adminDoc.email,
        password: adminDoc.password,
        firstName: adminDoc.firstName || '',
        lastName: adminDoc.lastName || '',
        lastLogin: adminDoc.lastLogin || null,
        totalPurchased: adminDoc.totalPurchased || 0,
        createdAt: adminDoc.createdAt || new Date()
      });
      
      await dbLogin.collection('admin').deleteOne({ email: emailRegex });
    }
    
    res.json({ success: true, message: `Account updated to ${role} successfully` });
  } catch (err) {
    console.error('Error changing account role:', err);
    res.status(500).json({ error: 'Failed to change account role' });
  }
});

// I. Create Admin Account Endpoint (Admin-only creation)
app.post('/api/accounts/admin', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }
    
    if (!dbLogin) {
      return res.status(500).json({ error: 'Auth database not connected' });
    }
    
    const emailRegex = { $regex: new RegExp(`^${email}$`, 'i') };
    
    const userExists = await dbLogin.collection('users').findOne({ email: emailRegex });
    const adminExists = await dbLogin.collection('admin').findOne({ email: emailRegex });
    
    if (userExists || adminExists) {
      return res.status(400).json({ error: 'Email address is already registered.' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'admin',
      totalPurchased: 0,
      lastLogin: null,
      createdAt: new Date()
    };
    
    await dbLogin.collection('admin').insertOne(newAdmin);
    
    res.json({ success: true, message: 'Administrator account created successfully.' });
  } catch (err) {
    console.error('Error creating admin account:', err);
    res.status(500).json({ error: 'Failed to create administrator account.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});

