import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  foodName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'portions' },
  costPerUnit: { type: Number, required: true },
  pricePerUnit: { type: Number, required: true },
  notes: { type: String, default: '' },
});

const restaurantSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    area: { type: String, required: true },
    cuisine: { type: String, default: 'Various' },
    lat: { type: Number, required: true, default: 6.9271 },
    lng: { type: Number, required: true, default: 79.8612 },
    templates: [templateSchema],
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export default Restaurant;

