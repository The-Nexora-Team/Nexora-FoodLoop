import mongoose from 'mongoose';

const volunteerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    vehicle: { type: String, default: 'Motorbike / Scooter' },
    area: { type: String, required: true },
    phone: { type: String, default: '' },
    lat: { type: Number, required: true, default: 6.915 },
    lng: { type: Number, required: true, default: 79.865 },
    reliabilityRating: { type: Number, default: 4.9 },
    hoursLogged: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    proBonoRescues: { type: Number, default: 0 },
    available: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Volunteer = mongoose.model('Volunteer', volunteerSchema);
export default Volunteer;

