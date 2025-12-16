import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Product from '../models/Product.ts';
import Customer from '../models/Customer.ts';
import Order from '../models/Order.ts';
import User from '../models/User.ts';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'horder-secret-key-change-me';

// --- AUTH MIDDLEWARE ---

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

// --- AUTH ROUTE ---

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Seed default admin if no users exist
        const count = await User.countDocuments();
        if (count === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            const admin = new User({ username: 'admin', password: hashedPassword });
            await admin.save();
        }

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ success: false, message: 'User not found' });

        let validPass = false;
        try {
            validPass = await bcrypt.compare(password, user.password);
        } catch (e) {
            // bcrypt might throw if the stored password isn't a valid hash
        }

        // Migration Strategy: Check if it's a legacy plain-text password
        if (!validPass && user.password === password) {
            console.log(`Migrating legacy password for user: ${username}`);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user.password = hashedPassword;
            await user.save();
            validPass = true;
        }

        if (!validPass) return res.status(400).json({ success: false, message: 'Invalid password' });

        // Create Token
        const token = jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET);
        res.header('Authorization', token).json({ success: true, token });

    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

// --- PROFILE ROUTES ---

router.get('/profile', verifyToken, async (req: any, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

router.put('/profile', verifyToken, async (req: any, res) => {
    try {
        const { fullName } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { fullName },
            { new: true }
        ).select('-password');
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ message: 'Error updating profile' });
    }
});

router.put('/password', verifyToken, async (req: any, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Verify old password
        const validPass = await bcrypt.compare(oldPassword, user.password);
        if (!validPass) return res.status(400).json({ success: false, message: 'Mật khẩu cũ không đúng' });

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ success: true, message: 'Password updated' });
    } catch (err) {
        res.status(500).json({ message: 'Error changing password' });
    }
});

// --- PROTECTED ROUTES ---

// --- PRODUCTS ---

router.get('/products', verifyToken, async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

router.post('/products', verifyToken, async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

router.delete('/products/:id', verifyToken, async (req, res) => {
    try {
        await Product.findOneAndDelete({ id: req.params.id });
        res.json({ message: 'Deleted Product' });
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

// --- CUSTOMERS ---

router.get('/customers', verifyToken, async (req, res) => {
    try {
        const customers = await Customer.find();
        res.json(customers);
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

router.post('/customers', verifyToken, async (req, res) => {
    try {
        const newCustomer = new Customer(req.body);
        await newCustomer.save();
        res.status(201).json(newCustomer);
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

router.put('/customers/:id', verifyToken, async (req, res) => {
    try {
        const updatedCustomer = await Customer.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(updatedCustomer);
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

// --- ORDERS ---

router.get('/orders', verifyToken, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }); // Sort by newest first
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

router.post('/orders', verifyToken, async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

router.put('/orders/:id', verifyToken, async (req, res) => {
    try {
        const updatedOrder = await Order.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(updatedOrder);
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

router.delete('/orders/:id', verifyToken, async (req, res) => {
    try {
        await Order.findOneAndDelete({ id: req.params.id });
        res.json({ message: 'Deleted Order' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: (err as Error).message });
    }
});

export default router;
