import express from 'express';
import Product from '../models/Product.ts';
import Customer from '../models/Customer.ts';
import Order from '../models/Order.ts';

const router = express.Router();

// --- PRODUCTS ---

router.get('/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

router.post('/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

router.delete('/products/:id', async (req, res) => {
    try {
        await Product.findOneAndDelete({ id: req.params.id });
        res.json({ message: 'Deleted Product' });
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

// --- CUSTOMERS ---

router.get('/customers', async (req, res) => {
    try {
        const customers = await Customer.find();
        res.json(customers);
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

router.post('/customers', async (req, res) => {
    try {
        const newCustomer = new Customer(req.body);
        await newCustomer.save();
        res.status(201).json(newCustomer);
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

router.put('/customers/:id', async (req, res) => {
    try {
        const updatedCustomer = await Customer.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(updatedCustomer);
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

// --- ORDERS ---

router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }); // Sort by newest first
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

router.post('/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

router.put('/orders/:id', async (req, res) => {
    try {
        const updatedOrder = await Order.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(updatedOrder);
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

router.delete('/orders/:id', async (req, res) => {
    try {
        await Order.findOneAndDelete({ id: req.params.id });
        res.json({ message: 'Deleted Order' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: (err as Error).message });
    }
});

export default router;
