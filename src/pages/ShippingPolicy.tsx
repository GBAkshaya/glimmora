export default function ShippingPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <p className="eyebrow mb-2">Customer Care</p>
      <h1 className="font-logo text-3xl mb-8">Shipping Policy</h1>

      <div className="flex flex-col gap-6 text-sm text-charcoal/70 leading-relaxed">
        <p>
          Glimmora currently ships across India. We're a small, growing business, so please bear
          with us as we scale up our fulfilment.
        </p>

        <section>
          <h2 className="text-charcoal font-medium mb-2">Delivery Charges</h2>
          <p>
            A delivery charge applies to all orders. This will be confirmed to you before your
            payment is requested, once your order is placed.
          </p>
        </section>

        <section>
          <h2 className="text-charcoal font-medium mb-2">Processing &amp; Delivery Time</h2>
          <p>
            Orders are processed and dispatched after payment is confirmed. Delivery timelines
            depend on your location and will be shared with you over WhatsApp once your order is
            confirmed.
          </p>
        </section>

        <section>
          <h2 className="text-charcoal font-medium mb-2">Order Tracking</h2>
          <p>
            You'll receive updates on your order status over WhatsApp as it moves from Confirmed
            to Shipped to Delivered. You can also check your order status anytime on the{' '}
            <a href="/orders" className="text-gold-dark underline">
              My Orders
            </a>{' '}
            page.
          </p>
        </section>

        <section>
          <h2 className="text-charcoal font-medium mb-2">Payment</h2>
          <p>
            We currently accept prepaid orders only, paid via the QR code shared with you on
            WhatsApp after checkout. Cash on delivery is not available at this time.
          </p>
        </section>

        <p className="text-xs text-charcoal/50">
          Questions about a specific order? Reach out to us on WhatsApp or email — details in the
          footer.
        </p>
      </div>
    </div>
  )
}
