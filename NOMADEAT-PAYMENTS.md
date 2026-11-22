# NomadEat: hold the payment until the kitchen starts cooking

For the Spring Boot backend, `stripe-java` 23.8.0, API version `2023-08-16`.

The kitchen (role `KITCHEN`) accepts and cooks. `ORGANISATION` is a food group and has no part in this.

## How it works

1. The diner taps Order. The backend reserves the portions and returns a Stripe Checkout link.
2. The diner pays. Stripe **holds** the money and sends `payment_intent.amount_capturable_updated`.
3. Only then does the kitchen see the order.
4. The kitchen taps Start cooking. The backend **captures** the hold. If that fails, cooking doesn't start.
5. A decline, or 15 minutes without an answer, **releases** the hold and returns the portions.
6. The kitchen's earning starts clearing at COLLECTED.

| Event | `paymentStatus` | `status` | Kitchen sees it | Portions |
|---|---|---|---|---|
| Order created | AWAITING_PAYMENT | NEW | No | Reserved |
| Hold confirmed | HELD | NEW | Yes | Reserved |
| Start cooking | CAPTURED | PREPARING | Yes | Used |
| Decline or timeout | RELEASED | CANCELLED | As cancelled | Returned |
| Checkout abandoned | EXPIRED | CANCELLED | No | Returned |
| Cancelled after capture | REFUNDED | CANCELLED | As cancelled | Not returned |

## 1. New columns on MealOrder

- `paymentStatus`: the six values above
- `unitPricePence`: long, copied from the meal when ordering
- `stripeSessionId`, `paymentIntentId`, `chargeId`: nullable strings
- `heldAt`: nullable timestamp

Meal orders that already exist have no payment. Set them to CANCELLED and EXPIRED.

## 2. The Stripe calls: `MealPaymentService.java`

```java
package com.farmnomad.service;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.model.checkout.Session;
import com.stripe.net.RequestOptions;
import com.stripe.param.PaymentIntentCancelParams;
import com.stripe.param.PaymentIntentCaptureParams;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import java.time.Instant;
import org.springframework.stereotype.Service;

@Service
public class MealPaymentService {

    public static final String KIND = "MEAL_ORDER";

    /** What the money ended up as. */
    public enum Outcome { RELEASED, REFUNDED }

    /** Opens Checkout in hold mode. The price comes from the database, never from the request. */
    public Session startCheckout(long orderId, long mealId, String mealName,
                                 long unitPricePence, long quantity, String frontendUrl) throws StripeException {
        String id = String.valueOf(orderId);
        SessionCreateParams params = SessionCreateParams.builder()
            .setMode(SessionCreateParams.Mode.PAYMENT)
            .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
            .setExpiresAt(Instant.now().plusSeconds(31 * 60).getEpochSecond()) // Stripe's minimum is 30 minutes
            .setSuccessUrl(frontendUrl + "/nomadeat?ordered=" + id)
            .setCancelUrl(frontendUrl + "/nomadeat/" + mealId + "?payment=cancelled")
            .putMetadata("kind", KIND)
            .putMetadata("mealOrderId", id)
            .setPaymentIntentData(SessionCreateParams.PaymentIntentData.builder()
                .setCaptureMethod(SessionCreateParams.PaymentIntentData.CaptureMethod.MANUAL)
                .putMetadata("kind", KIND)
                .putMetadata("mealOrderId", id)
                .build())
            .addLineItem(SessionCreateParams.LineItem.builder()
                .setQuantity(quantity)
                .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                    .setCurrency("gbp")
                    .setUnitAmount(unitPricePence)
                    .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                        .setName(mealName)
                        .build())
                    .build())
                .build())
            .build();
        return Session.create(params);
    }

    /** Takes the held money. Safe to repeat. */
    public PaymentIntent capture(String paymentIntentId) throws StripeException {
        PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
        if ("succeeded".equals(intent.getStatus())) return intent;
        if (!"requires_capture".equals(intent.getStatus())) {
            throw new IllegalStateException("The payment hold is no longer available");
        }
        return intent.capture(PaymentIntentCaptureParams.builder().build(), key("capture", paymentIntentId));
    }

    /** Releases a hold, or refunds in full if it was already captured. Safe to repeat. */
    public Outcome giveBack(String paymentIntentId) throws StripeException {
        PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
        switch (intent.getStatus()) {
            case "canceled":
                return Outcome.RELEASED;
            case "requires_capture":
                intent.cancel(PaymentIntentCancelParams.builder().build(), key("release", paymentIntentId));
                return Outcome.RELEASED;
            case "succeeded":
                Refund.create(RefundCreateParams.builder().setPaymentIntent(paymentIntentId).build(),
                    key("refund", paymentIntentId));
                return Outcome.REFUNDED;
            default:
                throw new IllegalStateException("Cannot give back a payment that is " + intent.getStatus());
        }
    }

    private static RequestOptions key(String action, String id) {
        return RequestOptions.builder().setIdempotencyKey("meal-" + action + "-" + id).build();
    }
}
```

## 3. The webhook events: `MealWebhookHandler.java`

```java
package com.farmnomad.service;

import com.stripe.exception.StripeException;
import com.stripe.model.Charge;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class MealWebhookHandler {

    /** Implement these three in your meal order service. */
    public interface MealPaymentEvents {
        void paymentHeld(long orderId, String paymentIntentId) throws StripeException;
        void holdReleased(long orderId);
        void checkoutExpired(long orderId);
    }

    private final MealPaymentEvents orders;

    public MealWebhookHandler(MealPaymentEvents orders) {
        this.orders = orders;
    }

    /** True means it was a meal event, so the produce checkout code must not run. */
    public boolean handle(Event event) throws StripeException {
        StripeObject object = event.getDataObjectDeserializer().getObject().orElse(null);

        Map<String, String> metadata;
        if (object instanceof Session session) metadata = session.getMetadata();
        else if (object instanceof PaymentIntent intent) metadata = intent.getMetadata();
        else if (object instanceof Charge charge) metadata = charge.getMetadata();
        else return false;

        if (metadata == null || !MealPaymentService.KIND.equals(metadata.get("kind"))) return false;
        long orderId = Long.parseLong(metadata.get("mealOrderId"));

        switch (event.getType()) {
            case "payment_intent.amount_capturable_updated" -> {
                PaymentIntent intent = (PaymentIntent) object;
                if ("requires_capture".equals(intent.getStatus())) orders.paymentHeld(orderId, intent.getId());
            }
            case "payment_intent.canceled" -> orders.holdReleased(orderId);
            case "checkout.session.expired" -> orders.checkoutExpired(orderId);
            default -> { } // completed and refunded need nothing more here
        }
        return true;
    }
}
```

In `WebhookController`, straight after `Webhook.constructEvent(...)` and **before** any existing handling:

```text
if (mealWebhookHandler.handle(event)) return ResponseEntity.ok().build();
```

This line matters. Without it a meal's `checkout.session.completed` runs the produce code, which could create
produce orders from that diner's cart. If `handle` throws, return 500 so that Stripe retries.

## 4. Rules for the meal order service

Every method that changes a payment uses `@Transactional(rollbackFor = Exception.class)` and loads the order
with a write lock (`@Lock(LockModeType.PESSIMISTIC_WRITE)`), so Start cooking and the timeout can't both win.
`StripeException` is a checked exception, which plain `@Transactional` does not roll back.

**POST /meal-orders**
- Take the customer from the JWT.
- Lock the meal. Check it is available and has the portions, then subtract them.
- `unitPricePence = BigDecimal.valueOf(price).movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact()`
- Refuse totals under 30p, which is Stripe's GBP minimum.
- Save as NEW and AWAITING_PAYMENT, call `startCheckout`, save `session.getId()`.
- Return `{ "orderId": 12, "checkoutUrl": session.getUrl() }`.

**paymentHeld**
- Already HELD or CAPTURED: do nothing.
- AWAITING_PAYMENT: save the payment intent id, set HELD and `heldAt`, notify the kitchen.
- CANCELLED: call `giveBack`, because the diner paid for an order that no longer exists.

**holdReleased and checkoutExpired**
- holdReleased acts only on AWAITING_PAYMENT or HELD. checkoutExpired acts only on AWAITING_PAYMENT.
- Cancel the order, set RELEASED or EXPIRED, return the portions once, notify the diner.

**PATCH /meal-orders/{id}/status**
- The caller must be that order's kitchen, or ADMIN.
- Allow only NEW > PREPARING > READY > COLLECTED, plus CANCELLED before COLLECTED.
- PREPARING needs HELD. Call `capture` first, then save CAPTURED, `intent.getLatestCharge()` and PREPARING.
- If capture fails, keep NEW and answer 402 `{ "message": "The payment couldn't be taken, so don't start cooking." }`.
- READY and COLLECTED need CAPTURED.
- CANCELLED: call `giveBack` and save what it returns. Return portions only for RELEASED.
- COLLECTED: create the kitchen's earning. Set the later transfer's `source_transaction` to `chargeId`.
- A refund after an earning exists must also reverse that earning and any transfer.

**Lists**
- `/meal-orders/kitchen` never returns AWAITING_PAYMENT or EXPIRED.
- `/meal-orders/my` doesn't return EXPIRED.
- Add `paymentStatus` to MealOrderResponse.

**POST /checkout/confirm**
- Reject a session whose metadata `kind` is MEAL_ORDER.

**Every minute (`@Scheduled(fixedDelay = 60000)`), one transaction per order**
- HELD, still NEW, `heldAt` over 15 minutes ago: `giveBack`, then cancel.
- AWAITING_PAYMENT for over 35 minutes: `Session.retrieve(stripeSessionId)`. If its status is `expired`, run
  checkoutExpired. If it is `complete`, retrieve its payment intent and run paymentHeld when that says
  `requires_capture`. This covers a missed webhook.
- A sleeping Render free instance runs no scheduled jobs. Use an always-on instance, and also refuse PREPARING
  when `heldAt` is over 15 minutes ago.

## 5. Add three events to webhook A

Run `stripe webhook_endpoints list` in the Stripe Shell, copy A's `we_...` id, then run this with that id.
The list replaces the old one, so it repeats the first three. The secret and API version stay the same.

```text
stripe webhook_endpoints update we_REPLACE_ME -d "enabled_events[]=checkout.session.completed" -d "enabled_events[]=checkout.session.async_payment_succeeded" -d "enabled_events[]=charge.refunded" -d "enabled_events[]=payment_intent.amount_capturable_updated" -d "enabled_events[]=payment_intent.canceled" -d "enabled_events[]=checkout.session.expired"
```

B and C don't change.

## 6. Frontend

- Order button: "Continue to payment", then go to `checkoutUrl`. Refuse a response without one.
- Replace "Pay on collection" with "Your card is held now and charged when the kitchen starts cooking."
- `/nomadeat?ordered=ID`: show "Confirming your payment" until that order is HELD.
- `/nomadeat/{mealId}?payment=cancelled`: say that nothing was charged.
- Start cooking shows the API's 402 message.
- Decline says the diner isn't charged.
- `FEATURES.mealOrders` stays false until sections 1 to 5 are deployed.

## 7. Test in the sandbox

| Test | Expected |
|---|---|
| Pay with 4242 4242 4242 4242 | Stripe shows Uncaptured, and the kitchen sees the order |
| Start cooking | Stripe shows Succeeded |
| Decline a new order | Stripe shows Canceled, portions return, no refund fee |
| Leave a held order for 16 minutes | Released automatically |
| Pay with 4000 0000 0000 0002 | Declined at Checkout, the kitchen never sees it |
| Close Checkout without paying | After 31 minutes the portions return |
| Cancel after Start cooking | Refunded |
| Resend a webhook event | Nothing happens twice |
| Order a meal with produce in the cart | No produce order is created, and the cart is untouched |
