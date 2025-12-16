import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
    id: string;
    name: string;
    email: string;
    phone: string;
    fbLink: string;
    createdAt: string;
}

const CustomerSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, required: true },
    fbLink: { type: String, default: '' },
    createdAt: { type: String, required: true }
});

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
