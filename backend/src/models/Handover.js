import mongoose from 'mongoose';

const handoverSchema = new mongoose.Schema(
  {
    matchId: { type: String, required: true },
    listingId: { type: String, required: true },
    volunteerId: { type: String, required: true },
    receiverId: { type: String, required: true },
    claimedAt: { type: Number, default: () => Date.now() },
    pickedUpAt: { type: Number, default: null },
    deliveredAt: { type: Number, default: null },
    temperatureCheck: { type: String, default: null }, // 'Hot (>60°C)' or 'Cold (<5°C)'
    deliveryNotes: { type: String, default: '' },
    confirmed: { type: Boolean, default: false },
    deliveryFeeLKR: { type: Number, default: 220 },
  },
  { timestamps: true }
);

export const Handover = mongoose.model('Handover', handoverSchema);
export default Handover;

