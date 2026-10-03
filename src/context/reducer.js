/* ============================================
   FoodLoop State Reducer
   ============================================ */

import { LISTING_STATUS, MATCH_STATUS } from '../utils/constants.js';

export const ACTION_TYPES = {
  // Auth & Registration
  SET_USER: 'SET_USER',
  LOGOUT: 'LOGOUT',
  REGISTER_RESTAURANT: 'REGISTER_RESTAURANT',
  REGISTER_RECEIVER: 'REGISTER_RECEIVER',
  REGISTER_VOLUNTEER: 'REGISTER_VOLUNTEER',

  // Clock
  TICK: 'TICK',
  SET_SPEED: 'SET_SPEED',

  // Listings
  ADD_LISTING: 'ADD_LISTING',
  UPDATE_LISTING: 'UPDATE_LISTING',
  UPDATE_LISTING_STATUS: 'UPDATE_LISTING_STATUS',
  SELL_PORTIONS: 'SELL_PORTIONS',

  // Matches
  CREATE_MATCH: 'CREATE_MATCH',
  ACCEPT_MATCH: 'ACCEPT_MATCH',
  DECLINE_MATCH: 'DECLINE_MATCH',
  ESCALATE_MATCH: 'ESCALATE_MATCH',
  ROUTE_TO_RECYCLING: 'ROUTE_TO_RECYCLING',

  // Handovers
  CLAIM_PICKUP: 'CLAIM_PICKUP',
  CONFIRM_PICKUP: 'CONFIRM_PICKUP',
  CONFIRM_DELIVERY: 'CONFIRM_DELIVERY',

  // Receivers
  UPDATE_RECEIVER: 'UPDATE_RECEIVER',

  // Data
  LOAD_STATE: 'LOAD_STATE',
  RESET: 'RESET',

  // Sync
  SYNC_STATE: 'SYNC_STATE',
};

export function foodLoopReducer(state, action) {
  switch (action.type) {

    // ---- Auth & Registration ----
    case ACTION_TYPES.SET_USER:
      return { ...state, currentUser: action.payload };

    case ACTION_TYPES.LOGOUT:
      return { ...state, currentUser: null };

    case ACTION_TYPES.REGISTER_RESTAURANT:
      return {
        ...state,
        restaurants: [...state.restaurants, action.payload.restaurant],
        currentUser: action.payload.user,
      };

    case ACTION_TYPES.REGISTER_RECEIVER:
      return {
        ...state,
        receivers: [...state.receivers, action.payload.receiver],
        currentUser: action.payload.user,
      };

    case ACTION_TYPES.REGISTER_VOLUNTEER:
      return {
        ...state,
        volunteers: [...state.volunteers, action.payload.volunteer],
        currentUser: action.payload.user,
      };

    // ---- Clock ----
    case ACTION_TYPES.TICK:
      return { ...state, simNow: action.payload.simNow };

    case ACTION_TYPES.SET_SPEED:
      return { ...state, speed: action.payload };

    // ---- Listings ----
    case ACTION_TYPES.ADD_LISTING:
      return {
        ...state,
        listings: [...state.listings, action.payload],
      };

    case ACTION_TYPES.UPDATE_LISTING:
      return {
        ...state,
        listings: state.listings.map((l) =>
          l.id === action.payload.id ? { ...l, ...action.payload } : l
        ),
      };

    case ACTION_TYPES.UPDATE_LISTING_STATUS:
      return {
        ...state,
        listings: state.listings.map((l) =>
          l.id === action.payload.id
            ? { ...l, status: action.payload.status, currentStep: action.payload.currentStep || l.currentStep }
            : l
        ),
      };

    case ACTION_TYPES.SELL_PORTIONS: {
      const { listingId, quantitySold, salePricePerUnit, discountPercent } = action.payload;
      const listing = state.listings.find((l) => l.id === listingId);
      if (!listing) return state;

      const soldQty = Math.max(1, Math.min(listing.quantity, Number(quantitySold) || 1));
      const remainingQty = listing.quantity - soldQty;
      const discount = discountPercent !== undefined ? discountPercent : (listing.discountPercent || 0.4);
      const unitPrice = salePricePerUnit || Math.round(listing.pricePerUnit * (1 - discount));
      const totalSaleAmount = soldQty * unitPrice;
      const netProfit = Math.round(soldQty * (unitPrice - listing.costPerUnit));

      let updatedListings;
      if (remainingQty <= 0) {
        // Entire batch sold
        updatedListings = state.listings.map((l) =>
          l.id === listingId
            ? {
                ...l,
                status: 'sold',
                currentStep: 'sell',
                quantity: soldQty,
                saleAmount: totalSaleAmount,
                netProfit,
                discountPercent: discount,
                soldAt: state.simNow || Date.now(),
              }
            : l
        );
      } else {
        // Partial portions sold: update original listing and add sold record
        const soldRecord = {
          ...listing,
          id: 'sold-' + Date.now(),
          quantity: soldQty,
          status: 'sold',
          currentStep: 'sell',
          saleAmount: totalSaleAmount,
          netProfit,
          discountPercent: discount,
          soldAt: state.simNow || Date.now(),
        };

        updatedListings = state.listings
          .map((l) =>
            l.id === listingId
              ? { ...l, quantity: remainingQty }
              : l
          )
          .concat(soldRecord);
      }

      return {
        ...state,
        listings: updatedListings,
      };
    }

    // ---- Matches ----
    case ACTION_TYPES.CREATE_MATCH:
      return {
        ...state,
        matches: [...state.matches, action.payload],
        listings: state.listings.map((l) =>
          l.id === action.payload.listingId
            ? { ...l, matchId: action.payload.id }
            : l
        ),
      };

    case ACTION_TYPES.ACCEPT_MATCH: {
      const { matchId, receiverId, requestedQuantity } = action.payload;
      const match = state.matches.find((m) => m.id === matchId);
      const listing = match ? state.listings.find((l) => l.id === match.listingId) : null;

      if (listing && (listing.unsafeByTime <= state.simNow || listing.status === LISTING_STATUS.EXPIRED)) {
        // Expired food is unsafe and cannot be accepted for human consumption
        return state;
      }

      const totalQty = listing ? listing.quantity : 1;
      const claimedQty = Math.max(1, Math.min(totalQty, Number(requestedQuantity) || totalQty));
      const remainingQty = totalQty - claimedQty;

      let updatedListings = [];
      let updatedMatches = state.matches.map((m) =>
        m.id === matchId
          ? {
              ...m,
              status: MATCH_STATUS.ACCEPTED,
              acceptedBy: receiverId,
              requestedQuantity: claimedQty,
            }
          : m
      );

      if (remainingQty > 0 && listing) {
        // Create an allocated donation listing for the requested quantity
        const allocatedListingId = 'alloc-' + Date.now();
        const allocatedListing = {
          ...listing,
          id: allocatedListingId,
          quantity: claimedQty,
          status: LISTING_STATUS.DONATING,
          currentStep: 'donate',
          matchId,
        };

        // Update match to point to allocated listing
        updatedMatches = updatedMatches.map((m) =>
          m.id === matchId ? { ...m, listingId: allocatedListingId } : m
        );

        // Keep remaining quantity on original listing active for other shelters / sales!
        updatedListings = state.listings.map((l) =>
          l.id === listing.id
            ? { ...l, quantity: remainingQty }
            : l
        ).concat(allocatedListing);
      } else {
        // Entire batch was requested
        updatedListings = state.listings.map((l) => {
          if (match && l.id === match.listingId) {
            return {
              ...l,
              quantity: claimedQty,
              status: LISTING_STATUS.DONATING,
              currentStep: 'donate',
            };
          }
          return l;
        });
      }

      return {
        ...state,
        matches: updatedMatches,
        listings: updatedListings,
      };
    }

    case ACTION_TYPES.DECLINE_MATCH: {
      const { matchId, receiverId, reason } = action.payload;
      return {
        ...state,
        matches: state.matches.map((m) => {
          if (m.id !== matchId) return m;
          const declinedReasons = [...(m.declinedReasons || []), { receiverId, reason }];
          const nextIndex = m.currentOfferIndex + 1;
          const hasMore = nextIndex < m.rankedReceivers.filter((r) => !r.exclusionReason).length;
          return {
            ...m,
            declinedReasons,
            currentOfferIndex: nextIndex,
            offerSentAt: state.simNow,
            status: hasMore ? MATCH_STATUS.PENDING : MATCH_STATUS.ROUTED_TO_RECYCLING,
          };
        }),
      };
    }

    case ACTION_TYPES.ESCALATE_MATCH: {
      const { matchId } = action.payload;
      return {
        ...state,
        matches: state.matches.map((m) => {
          if (m.id !== matchId) return m;
          const nextIndex = m.currentOfferIndex + 1;
          const eligibleReceivers = m.rankedReceivers.filter((r) => !r.exclusionReason);
          const hasMore = nextIndex < eligibleReceivers.length;
          return {
            ...m,
            currentOfferIndex: nextIndex,
            offerSentAt: state.simNow,
            status: hasMore ? MATCH_STATUS.PENDING : MATCH_STATUS.ROUTED_TO_RECYCLING,
          };
        }),
      };
    }

    case ACTION_TYPES.ROUTE_TO_RECYCLING: {
      const { matchId } = action.payload;
      const match = state.matches.find((m) => m.id === matchId);
      return {
        ...state,
        matches: state.matches.map((m) =>
          m.id === matchId ? { ...m, status: MATCH_STATUS.ROUTED_TO_RECYCLING } : m
        ),
        listings: state.listings.map((l) =>
          match && l.id === match.listingId
            ? { ...l, status: LISTING_STATUS.RECYCLING, currentStep: 'recycle' }
            : l
        ),
      };
    }

    // ---- Handovers ----
    case ACTION_TYPES.CLAIM_PICKUP:
      return {
        ...state,
        handovers: [...state.handovers, action.payload],
        listings: state.listings.map((l) =>
          l.id === action.payload.listingId
            ? { ...l, volunteerId: action.payload.volunteerId }
            : l
        ),
      };

    case ACTION_TYPES.CONFIRM_PICKUP:
      return {
        ...state,
        handovers: state.handovers.map((h) =>
          h.id === action.payload.handoverId
            ? { ...h, pickedUpAt: action.payload.timestamp, temperatureCheck: action.payload.temperatureCheck }
            : h
        ),
      };

    case ACTION_TYPES.CONFIRM_DELIVERY: {
      const handover = state.handovers.find((h) => h.id === action.payload.handoverId);
      const isPaid = handover?.payoutMode === 'paid';
      const fee = Number(handover?.earnedFee) || 0;

      return {
        ...state,
        handovers: state.handovers.map((h) =>
          h.id === action.payload.handoverId
            ? { ...h, deliveredAt: action.payload.timestamp, confirmed: true }
            : h
        ),
        volunteers: state.volunteers.map((v) => {
          if (handover && v.id === handover.volunteerId) {
            return {
              ...v,
              hoursLogged: (v.hoursLogged || 0) + 1,
              totalEarnings: (v.totalEarnings || 0) + (isPaid ? fee : 0),
              proBonoRescues: (v.proBonoRescues || 0) + (isPaid ? 0 : 1),
            };
          }
          return v;
        }),
        listings: state.listings.map((l) => {
          if (handover && l.id === handover.listingId) {
            const match = state.matches.find((m) => m.listingId === l.id);
            const receiver = match
              ? state.receivers.find((r) => r.id === match.acceptedBy)
              : null;
            const finalStatus = receiver?.isRecycler
              ? LISTING_STATUS.RECYCLED
              : LISTING_STATUS.DONATED;
            return { ...l, status: finalStatus };
          }
          return l;
        }),
      };
    }

    // ---- Receivers ----
    case ACTION_TYPES.UPDATE_RECEIVER:
      return {
        ...state,
        receivers: state.receivers.map((r) =>
          r.id === action.payload.id ? { ...r, ...action.payload } : r
        ),
      };

    // ---- Data ----
    case ACTION_TYPES.LOAD_STATE:
      return { ...action.payload };

    case ACTION_TYPES.RESET:
      return { ...action.payload };

    // ---- Cross-tab sync ----
    case ACTION_TYPES.SYNC_STATE:
      return {
        ...action.payload,
        // Keep local user session
        currentUser: state.currentUser,
      };

    default:
      console.warn(`Unknown action type: ${action.type}`);
      return state;
  }
}
