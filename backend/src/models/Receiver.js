import mongoose from 'mongoose';

const receiverSchema = new mongoose.Schema(
  {
    customId: { type: String, index: true },
    userId: { type: mongoose.Schema.Types.Mixed },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['childrens_home', 'elders_home', 'community_kitchen', 'compost_feed', 'shelter', 'other'],
      default: 'community_kitchen',
    },
    area: { type: String, required: true },
    lat: { type: Number, required: true, default: 6.92 },
    lng: { type: Number, required: true, default: 79.86 },
    acceptedCategories: {
      type: [String],
      default: ['cooked', 'bakery', 'produce'],
    },
    capacity: { type: Number, required: true, default: 50 },
    currentNeed: { type: Number, default: 80 }, // 0 to 100 percentage
    reliabilityRating: { type: Number, default: 4.8 },
    isRecycler: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true, strict: false }
);

export const Receiver = mongoose.model('Receiver', receiverSchema);
export default Receiver;

