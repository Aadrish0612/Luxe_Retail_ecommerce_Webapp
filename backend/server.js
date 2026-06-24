import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'productslog';
const COLLECTION_NAME = 'products';

app.use(cors());
app.use(express.json());

let db;
let client;

// Connect to MongoDB
async function connectToMongo() {
  try {
    client = await MongoClient.connect(MONGO_URI);
    db = client.db(DB_NAME);
    console.log(`Connected successfully to database: ${DB_NAME}`);
  } catch (err) {
    console.error('Failed to connect to MongoDB, retrying in 5 seconds...', err.message);
    setTimeout(connectToMongo, 5000);
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
        return ['smartphones', 'laptops', 'tablets', 'mobile-accessories', 'electronics', 'laptops-and-computers'].includes(cat);
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
    const { items } = req.body;
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

    for (const item of items) {
      const productId = Number(item.id);
      const qty = Number(item.quantity);

      const product = products.find(p => Number(p.id) === productId);
      if (product) {
        const currentStock = Number(product.stock || 0);
        const newStock = Math.max(0, currentStock - qty);
        const status = newStock === 0 ? 'Out of Stock' : 'In Stock';

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

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});

