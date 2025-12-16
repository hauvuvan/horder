import mongoose, { Schema, Document } from 'mongoose';

export interface IProductVariant {
    id: string;
    duration: string;
    importPrice: number;
    sellPrice: number;
}

export interface IProduct extends Document {
    id: string;
    name: string;
    source: string;
    variants: IProductVariant[];
    lastUpdated: string;
}

const ProductSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    source: { type: String, required: true },
    variants: [{
        id: { type: String, required: true },
        duration: { type: String, required: true },
        importPrice: { type: Number, required: true },
        sellPrice: { type: Number, required: true }
    }],
    lastUpdated: { type: String, required: true }
});

export default mongoose.model<IProduct>('Product', ProductSchema);
