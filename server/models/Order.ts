import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
    productId: string;
    productName: string;
    priceAtSale: number;
    costAtSale: number;
    usageTime: string;
}

export interface IOrderRefund {
    refundToCustomer: number;
    refundFromSupplier: number;
    refundDate: string;
    reason?: string;
}

export interface IOrder extends Document {
    id: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    items: IOrderItem[];
    totalAmount: number;
    status: 'completed' | 'pending' | 'cancelled';
    notes?: string;
    refundInfo?: IOrderRefund;
    createdAt: string;
}

const OrderSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    items: [{
        productId: { type: String, required: true },
        productName: { type: String, required: true },
        priceAtSale: { type: Number, required: true },
        costAtSale: { type: Number, required: true },
        usageTime: { type: String, required: true }
    }],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['completed', 'pending', 'cancelled'], default: 'completed' },
    notes: { type: String, default: '' },
    refundInfo: {
        refundToCustomer: { type: Number },
        refundFromSupplier: { type: Number },
        refundDate: { type: String },
        reason: { type: String }
    },
    createdAt: { type: String, required: true }
});

export default mongoose.model<IOrder>('Order', OrderSchema);
