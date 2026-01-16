/**
 * Fee Calculations for Moova Platform
 *
 * Fee Structure:
 * - Sender Service Fee (tiered by kg):
 *   - 0-5kg: $3.70
 *   - 5.01-9.99kg: $5.50
 *   - 10-20kg: $7.00
 *
 * - Traveler Commission: 8% of base price (goes to platform)
 * - Traveler Earnings: 92% of base price
 *   - 60% released in 24 hours
 *   - 40% held until delivery confirmed
 */

/**
 * Calculate sender service fee based on kg amount
 * @param {number} kg - Amount of kg
 * @returns {number} - Service fee in dollars
 */
export const calculateServiceFee = (kg) => {
  if (kg <= 0) return 0;
  if (kg <= 5) return 3.70;
  if (kg < 10) return 5.50;
  if (kg <= 20) return 7.00;
  return 7.00; // Default for anything over 20kg
};

/**
 * Calculate complete fee breakdown for a shipment
 * @param {number} kg - Amount of kg
 * @param {number} pricePerKg - Price per kg set by traveler
 * @returns {object} - Complete fee breakdown
 */
export const calculateFeeBreakdown = (kg, pricePerKg) => {
  // Base price (what traveler set)
  const basePrice = kg * pricePerKg;

  // Sender's service fee (tiered)
  const serviceFee = calculateServiceFee(kg);

  // Total sender pays
  const senderTotal = basePrice + serviceFee;

  // Platform commission from traveler (8% of base price)
  const platformCommission = basePrice * 0.08;

  // Traveler's net earnings (92% of base price)
  const travelerEarnings = basePrice * 0.92;

  // Traveler's initial payment (60% of net earnings)
  const travelerInitialPayment = travelerEarnings * 0.60;

  // Traveler's final payment on delivery (40% of net earnings)
  const travelerFinalPayment = travelerEarnings * 0.40;

  // Total platform revenue
  const platformRevenue = serviceFee + platformCommission;

  return {
    // Base amounts
    kg,
    pricePerKg,
    basePrice,

    // Sender breakdown
    serviceFee,
    senderTotal,

    // Platform revenue
    platformCommission,
    platformRevenue,

    // Traveler breakdown
    travelerEarnings,
    travelerInitialPayment,
    travelerFinalPayment,

    // Commission percentage
    commissionRate: 0.08, // 8%
  };
};

/**
 * Format currency for display
 * @param {number} amount - Amount in dollars
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
  return `$${amount.toFixed(2)}`;
};

/**
 * Get service fee description for UI
 * @param {number} kg - Amount of kg
 * @returns {string} - Description of fee tier
 */
export const getServiceFeeDescription = (kg) => {
  if (kg <= 0) return '';
  if (kg <= 5) return 'Service fee (0-5kg)';
  if (kg < 10) return 'Service fee (5-10kg)';
  if (kg <= 20) return 'Service fee (10-20kg)';
  return 'Service fee (10-20kg)';
};
