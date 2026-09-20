export default function ReturnsRefunds() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <p className="eyebrow mb-2">Customer Care</p>
      <h1 className="font-logo text-3xl mb-8">Returns &amp; Refunds</h1>

      <div className="flex flex-col gap-6 text-sm text-charcoal/70 leading-relaxed">
        <p>
          We want you to love what you ordered. If something isn't right, here's how returns and
          exchanges work.
        </p>

        <section>
          <h2 className="text-charcoal font-medium mb-2">Return Window</h2>
          <p>
            Returns and exchanges are accepted within <strong className="text-charcoal">7 days</strong> of
            delivery. To start a return, message us on WhatsApp from your{' '}
            <a href="/orders" className="text-gold-dark underline">
              My Orders
            </a>{' '}
            page with your order number.
          </p>
        </section>

        <section>
          <h2 className="text-charcoal font-medium mb-2">Condition</h2>
          <p>
            Items must be unused, unworn, and returned in their original packaging to be eligible
            for a return or exchange.
          </p>
        </section>

        <section>
          <h2 className="text-charcoal font-medium mb-2">Return Shipping</h2>
          <p>The cost of shipping the item back to us is covered by the customer.</p>
        </section>

        <section>
          <h2 className="text-charcoal font-medium mb-2">Refunds</h2>
          <p>
            Once we receive and inspect the returned item, approved refunds are sent directly to
            your UPI ID or bank account. Refunds are processed manually, so please allow a few
            days for the amount to reach you after approval.
          </p>
        </section>

        <p className="text-xs text-charcoal/50">
          Our products feature a coated finish, not fine/anti-tarnish jewellery — normal wear and
          care extends the finish, but gradual wear over time is expected with any coated piece.
        </p>
      </div>
    </div>
  )
}
