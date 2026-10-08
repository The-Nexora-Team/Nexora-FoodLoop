import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    listingId: { type: String, required: true },
    rankedReceivers: [
      {
        receiverId: String,
        receiverName: String,
        receiverType: String,
        score: Number,
        breakdown: Object,
        distanceKm: Number,
        estimatedTravelMin: Number,
        exclusionReason: String,
      },
    ],
    currentOfferIndex: { type: Number, default: 0 },
    offerSentAt: { type: Number, default: () => Date.now() },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'escalated', 'routed_to_recycling'],
      default: 'pending',
    },
    acceptedBy: { type: String, default: null },
    declinedReasons: [
      {
        receiverId: String,
        reason: String,
        timestamp: Number,
      },
    ],
  },
  { timestamps: true }
);

export const Match = mongoose.model('Match', matchSchema);
export default Match;

