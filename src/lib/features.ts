/**
 * Screens whose backend doesn't exist yet. They say so instead of showing made-up data or
 * failing halfway. When an endpoint ships, flip its flag and take its route out of
 * NO_LIST_YET or NOT_BUILT_YET in api/farmnomad.ts.
 */
export const FEATURES = {
  /** POST /meal-orders and the lists that go with it. */
  mealOrders: false,
  /** Dietary tags and source farms: MealRequest has no fields for them. */
  mealExtras: false,
  /** POST /crop-scans/diagnose. */
  cropDiagnosis: false,
  /** GET /weather/conditions and /weather/planting. */
  weather: false,
};
