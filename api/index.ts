// Vercel Serverless Function - Standalone API Handler
// This file must be self-contained for Vercel's bundler to work correctly.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'horder-secret-key-change-me';

// --- Mongoose Models (Inline) ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String }
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    source: String,
    lastUpdated: String,
    variants: [{ id: String, duration: String, importPrice: Number, sellPrice: Number }]
});
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const customerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    createdAt: String
});
const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

const orderSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    customerId: String,
    customerName: String,
    customerPhone: String,
    items: [{ productId: String, productName: String, variantId: String, variantName: String, priceAtSale: Number }],
    totalAmount: Number,
    status: String,
    createdAt: String
});
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// --- Database Connection ---
let isConnected = false;
const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState >= 1) {
        return;
    }
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is missing');
    }
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('Connected to MongoDB');
};

// --- Express App ---
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// --- Auth Middleware ---
const verifyToken = (req: any, res: any, next: any) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied' });
    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// --- Routes ---
app.post('/login', async (req, res) => {
    try {
        await connectDB();
        const { password } = req.body;
        const username = req.body.username?.toLowerCase().trim();
        let user = await User.findOne({ username });
        if (!user && username === 'admin') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            user = new User({ username: 'admin', password: hashedPassword });
            await user.save();
        } else if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }
        let validPass = false;
        try { validPass = await bcrypt.compare(password, user.password); } catch (e) { }
        if (!validPass && user.password === password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();
            validPass = true;
        }
        if (!validPass) return res.status(400).json({ success: false, message: 'Invalid password' });
        const token = jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET);
        res.json({ success: true, token });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, message: (err as Error).message });
    }
});

app.get('/profile', verifyToken, async (req: any, res) => {
    await connectDB();
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
});

app.put('/profile', verifyToken, async (req: any, res) => {
    await connectDB();
    const user = await User.findByIdAndUpdate(req.user._id, { fullName: req.body.fullName }, { new: true }).select('-password');
    res.json({ success: true, user });
});

app.put('/password', verifyToken, async (req: any, res) => {
    await connectDB();
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false });
    const validPass = await bcrypt.compare(req.body.oldPassword, user.password);
    if (!validPass) return res.status(400).json({ success: false, message: 'Mật khẩu cũ không đúng' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.newPassword, salt);
    await user.save();
    res.json({ success: true });
});

app.get('/products', verifyToken, async (req, res) => { await connectDB(); res.json(await Product.find()); });
app.post('/products', verifyToken, async (req, res) => { await connectDB(); res.status(201).json(await new Product(req.body).save()); });
app.delete('/products/:id', verifyToken, async (req, res) => { await connectDB(); await Product.findOneAndDelete({ id: req.params.id }); res.json({ message: 'Deleted' }); });

app.get('/customers', verifyToken, async (req, res) => { await connectDB(); res.json(await Customer.find()); });
app.post('/customers', verifyToken, async (req, res) => { await connectDB(); res.status(201).json(await new Customer(req.body).save()); });
app.put('/customers/:id', verifyToken, async (req, res) => { await connectDB(); res.json(await Customer.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })); });

app.get('/orders', verifyToken, async (req, res) => { await connectDB(); res.json(await Order.find().sort({ createdAt: -1 })); });
app.post('/orders', verifyToken, async (req, res) => { await connectDB(); res.status(201).json(await new Order(req.body).save()); });
app.put('/orders/:id', verifyToken, async (req, res) => { await connectDB(); res.json(await Order.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })); });
app.delete('/orders/:id', verifyToken, async (req, res) => { await connectDB(); await Order.findOneAndDelete({ id: req.params.id }); res.json({ message: 'Deleted' }); });

app.get('/backup', verifyToken, async (req, res) => {
    await connectDB();
    res.json({ products: await Product.find({}, '-_id -__v'), customers: await Customer.find({}, '-_id -__v'), orders: await Order.find({}, '-_id -__v'), users: await User.find({}, '-_id -__v'), timestamp: new Date().toISOString() });
});
app.post('/restore', verifyToken, async (req, res) => {
    await connectDB();
    const { products, customers, orders, users } = req.body;
    if (!products || !customers || !orders) return res.status(400).json({ message: 'Invalid backup' });
    await Product.deleteMany({}); await Customer.deleteMany({}); await Order.deleteMany({});
    if (users?.length) { await User.deleteMany({}); await User.insertMany(users); }
    await Product.insertMany(products); await Customer.insertMany(customers); await Order.insertMany(orders);
    res.json({ success: true, message: 'Restore completed' });
});

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Fallback 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Not Found', path: req.path }));

// --- Vercel Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Strip /api prefix if present, as vercel.json rewrites to this handler
    // Express app's routes are defined without /api prefix
    if (req.url?.startsWith('/api')) {
        req.url = req.url.replace('/api', '') || '/';
    }
    return app(req as any, res as any);
}
