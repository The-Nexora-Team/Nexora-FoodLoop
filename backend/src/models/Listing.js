import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    restaurantId: { type: String, required: true },
    restaurantName: { type: String, required: true },
    foodName: { type: String, required: true },
    category: {
      type: String,
      enum: ['cooked', 'bakery', 'produce', 'dairy', 'dry_goods'],
      required: true,
    },
    quantity: { type: Number, required: true },
    remainingQuantity: { type: Number, default: 0 },
    unit: { type: String, default: 'portions' },
    costPerUnit: { type: Number, required: true },
    pricePerUnit: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    unsafeByTime: { type: Number, required: true }, // timestamp ms
    postedAt: { type: Number, default: () => Date.now() },
    status: {
      type: String,
      enum: ['selling', 'donating', 'recycling', 'sold', 'donated', 'recycled', 'expired'],
      default: 'selling',
    },
    currentStep: {
      type: String,
      enum: ['sell', 'donate', 'recycle', 'done'],
      default: 'sell',
    },
    safetyChecklist: {
      keptHotOrChilled: { type: Boolean, default: true },
      cleanPackaging: { type: Boolean, default: true },
      allergens: [{ type: String }],
    },
    notes: { type: String, default: '' },
    matchId: { type: String, default: null },
    volunteerId: { type: String, default: null },
  },
  { timestamps: true }
);

export const Listing = mongoose.model('Listing', listingSchema);
export default Listing;

