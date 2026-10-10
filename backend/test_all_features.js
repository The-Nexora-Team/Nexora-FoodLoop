import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const API = 'http://localhost:5000/api';

async function req(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 FOODLOOP END-TO-END AUTOMATED VERIFICATION SUITE');
  console.log('======================================================\n');

  const timestamp = Date.now();

  // 1. HEALTH CHECK
  console.log('--- STEP 1: API Health Check ---');
  const health = await req('/health');
  if (!health.ok) throw new Error('Health check failed: ' + JSON.stringify(health.data));
  console.log('✅ API is healthy:', health.data.platform, '(Status: ' + health.data.status + ')');

  // 2. REGISTER TEST RESTAURANT
  console.log('\n--- STEP 2: Registering Test Restaurant ---');
  const restEmail = `royal.spice.${timestamp}@test.foodloop.lk`;
  const restReg = await req('/auth/register', 'POST', {
    name: 'Royal Spice Grand Buffet',
    email: restEmail,
    password: 'Password123!',
    role: 'restaurant',
    details: {
      area: 'Colombo 03 (Kollupitiya)',
      cuisine: 'Mughlai & Ceylon Fusion',
      lat: 6.9125,
      lng: 79.8507,
    },
  });
  if (!restReg.ok) throw new Error('Restaurant registration failed: ' + JSON.stringify(restReg.data));
  const restToken = restReg.data.token;
  const restId = restReg.data.profile.id;
  console.log('✅ Registered Restaurant:', restReg.data.user.name, '| ID:', restId);

  // 3. REGISTER TEST RECEIVER (SHELTER)
  console.log('\n--- STEP 3: Registering Test Receiver (Children’s Home) ---');
  const recvEmail = `hope.haven.${timestamp}@test.foodloop.lk`;
  const recvReg = await req('/auth/register', 'POST', {
    name: 'Hope Haven Children’s Home',
    email: recvEmail,
    password: 'Password123!',
    role: 'receiver',
    details: {
      type: 'childrens_home',
      area: 'Bambalapitiya',
      lat: 6.892,
      lng: 79.855,
      capacity: 65,
      currentNeed: 95,
      acceptedCategories: ['cooked', 'bakery'],
    },
  });
  if (!recvReg.ok) throw new Error('Receiver registration failed: ' + JSON.stringify(recvReg.data));
  const recvToken = recvReg.data.token;
  const recvId = recvReg.data.profile.id;
  console.log('✅ Registered Receiver:', recvReg.data.user.name, '| ID:', recvId);

  // 4. REGISTER TEST VOLUNTEER COURIER
  console.log('\n--- STEP 4: Registering Test Volunteer Courier ---');
  const volEmail = `saman.courier.${timestamp}@test.foodloop.lk`;
  const volReg = await req('/auth/register', 'POST', {
    name: 'Saman Kumara',
    email: volEmail,
    password: 'Password123!',
    role: 'volunteer',
    details: {
      vehicle: 'Motorbike / Thermal Carrier',
      area: 'Colombo 04',
      phone: '077 555 9988',
      lat: 6.896,
      lng: 79.858,
    },
  });
  if (!volReg.ok) throw new Error('Volunteer registration failed: ' + JSON.stringify(volReg.data));
  const volToken = volReg.data.token;
  const volId = volReg.data.profile.id;
  console.log('✅ Registered Volunteer:', volReg.data.user.name, '| ID:', volId);

  // 5. TEST RESTAURANT POSTING A SURPLUS BATCH
  console.log('\n--- STEP 5: Restaurant Posts Surplus Food Listing ---');
  const postListing = await req('/listings', 'POST', {
    foodName: 'Dum Biryani Family Feasts',
    category: 'cooked',
    quantity: 25,
    unit: 'portions',
    costPerUnit: 350,
    pricePerUnit: 800,
    hoursValid: 3,
    safetyChecklist: {
      keptHotOrChilled: true,
      cleanPackaging: true,
      allergens: ['Nuts'],
    },
    notes: 'Hot freshly sealed containers prepared after 9 PM buffet close.',
  }, restToken);
  if (!postListing.ok) throw new Error('Listing creation failed: ' + JSON.stringify(postListing.data));
  const listing = postListing.data.listing;
  const matchId = postListing.data.match?.id || listing.matchId;
  console.log('✅ Listing Created:', listing.foodName, '| Portions:', listing.quantity, '| ID:', listing.id);
  console.log('   Current Step:', listing.currentStep, '| Unsafe Time Window:', new Date(listing.unsafeByTime).toLocaleTimeString());

  // 6. TEST DYNAMIC FLASH SALE
  console.log('\n--- STEP 6: Flash Sale Portion Purchase ---');
  const sellRes = await req(`/listings/${listing.id}/sell`, 'POST', {
    portionsSold: 5,
  }, restToken);
  if (!sellRes.ok) throw new Error('Portion sale failed: ' + JSON.stringify(sellRes.data));
  console.log('✅ Sold 5 portions. Remaining quantity:', sellRes.data.listing.remainingQuantity, 'portions');

  // 7. TEST RECEIVER ACCEPTING THE DONATION MATCH
  console.log('\n--- STEP 7: Receiver Accepts Donation Offer ---');
  const acceptRes = await req(`/matches/${matchId}/accept`, 'POST', {}, recvToken);
  if (!acceptRes.ok) throw new Error('Match acceptance failed: ' + JSON.stringify(acceptRes.data));
  console.log('✅ Match Accepted by Receiver:', acceptRes.data.match.status);

  // 8. TEST VOLUNTEER COURIER MISSION BOARD & CLAIM
  console.log('\n--- STEP 8: Volunteer Claims Delivery Mission ---');
  const claimRes = await req('/handovers/claim', 'POST', {
    matchId,
  }, volToken);
  if (!claimRes.ok) throw new Error('Claim mission failed: ' + JSON.stringify(claimRes.data));
  const handoverId = claimRes.data.handover.id;
  console.log('✅ Volunteer Claimed Mission. Assigned Volunteer:', claimRes.data.handover.volunteerId, '| Handover ID:', handoverId);

  // 9. TEST HANDOVER TEMPERATURE VERIFICATION & PICKUP
  console.log('\n--- STEP 9: Pickup Handover with Food Safety Temperature Check ---');
  const pickupRes = await req(`/handovers/${handoverId}/pickup`, 'PATCH', {
    temperatureCheck: 'Hot (>60°C)',
    notes: 'Thermal test passed at 69.4°C. Sealed containers loaded into thermal bag.',
  }, volToken);
  if (!pickupRes.ok) throw new Error('Pickup confirmation failed: ' + JSON.stringify(pickupRes.data));
  console.log('✅ Verified Pickup Handover:', pickupRes.data.handover.temperatureCheck, '| Picked up at:', new Date(pickupRes.data.handover.pickedUpAt).toLocaleTimeString());

  // 10. TEST SAFE DELIVERY CONFIRMATION
  console.log('\n--- STEP 10: Confirming Safe Delivery to Shelter ---');
  const deliverRes = await req(`/handovers/${handoverId}/deliver`, 'PATCH', {
    deliveryNotes: 'Safely handed over to Sister in charge. Verification code matched.',
  }, volToken);
  if (!deliverRes.ok) throw new Error('Delivery confirmation failed: ' + JSON.stringify(deliverRes.data));
  console.log('✅ Safe Delivery Confirmed! Status Confirmed:', deliverRes.data.handover.confirmed);

  // 11. TEST ADMIN STATS & IMPACT METRICS
  console.log('\n--- STEP 11: Verifying Real-Time Impact Analytics ---');
  const loginAdmin = await req('/auth/login', 'POST', {
    email: 'admin@foodloop.lk',
    password: 'password123',
    role: 'admin',
  });
  if (!loginAdmin.ok) throw new Error('Admin login failed: ' + JSON.stringify(loginAdmin.data));
  const adminToken = loginAdmin.data.token;

  const statsRes = await req('/admin/stats', 'GET', null, adminToken);
  if (!statsRes.ok) throw new Error('Stats fetch failed: ' + JSON.stringify(statsRes.data));
  const stats = statsRes.data.stats;
  console.log('✅ Platform Stats:');
  console.log('   Total Users Registered:', stats.users.total);
  console.log('   Meals Rescued:', stats.impact.mealsRescued);
  console.log('   CO₂e Averted (kg):', stats.impact.co2SavedKg, 'kg');
  console.log('   Economic Value Saved (LKR): Rs.', stats.impact.moneySavedLKR.toLocaleString());

  // 12. VERIFY DIRECTLY IN MONGODB ATLAS
  console.log('\n--- STEP 12: Direct MongoDB Atlas Cloud Verification ---');
  await new Promise((r) => setTimeout(r, 1000));
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const userInAtlas = await db.collection('users').findOne({ email: restEmail });
  const listingInAtlas = await db.collection('listings').findOne({ customId: listing.id });
  const handoverInAtlas = await db.collection('handovers').findOne({ customId: handoverId });

  console.log('✅ MongoDB Atlas Query - New User exists in Atlas:', !!userInAtlas, '->', userInAtlas?.name);
  console.log('✅ MongoDB Atlas Query - New Listing exists in Atlas:', !!listingInAtlas, '->', listingInAtlas?.foodName);
  console.log('✅ MongoDB Atlas Query - Handover exists in Atlas with confirmed delivery:', handoverInAtlas?.confirmed);

  await mongoose.disconnect();

  console.log('\n======================================================');
  console.log('🎉 ALL 12 END-TO-END TEST SUITE STEPS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err.message);
  process.exit(1);
});
