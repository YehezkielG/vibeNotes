import { Schema, model, models, Document } from 'mongoose';

// 1. Definisikan Interface (Tipe TypeScript)
export interface ICounter extends Document {
  name: string; // Nama unik untuk counter-nya
  count: number;
}

// 2. Buat Skema (Aturan Mongoose)
const counterSchema = new Schema<ICounter>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  count: {
    type: Number,
    default: 0, // Mulai dari 0
  },
});

// 3. Ekspor Model
const Counter = models.Counter || model<ICounter>('Counter', counterSchema);

export default Counter;