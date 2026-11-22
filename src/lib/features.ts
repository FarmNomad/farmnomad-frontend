/** Switches for features that depend on newer backend endpoints. Set one to false to hide it again. */
export const FEATURES = {
  /**
   * Ordering on NomadEat. Keep false until POST /meal-orders returns a Stripe checkoutUrl and
   * orders carry paymentStatus: the card is held at order and charged when cooking starts.
   */
  mealOrders: false,
  /** Dietary tags on meals. */
  mealExtras: true,
  /** POST /crop-scans/diagnose. */
  cropDiagnosis: true,
  /** GET /weather/conditions and /weather/planting. */
  weather: true,
  /**
   * Surplus sold for less, to everyone, at the farmer's price. Keep false until products carry
   * surplusPricePence, surplusQuantity and surplusEndsAt, and POST /surplus takes a price.
   * Off, surplus stays free stock for verified food groups, as now.
   */
  surplusDeals: true,
  /** "Made with produce from": the meal API has no field for it, so it would be discarded. */
  mealSourceFarms: false,
};
