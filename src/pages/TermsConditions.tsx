export default function TermsConditions() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <p className="eyebrow mb-2">Customer Care</p>
      <h1 className="font-logo text-3xl mb-8">Terms &amp; Conditions</h1>

      <div className="flex flex-col gap-6 text-sm text-charcoal/70 leading-relaxed">
        <p>By using glimmora.in and placing an order with us, you agree to the following terms.</p>

        <section>
          <h2 className="text-charcoal font-medium mb-2">About Our Products</h2>
          <p>
            Glimmora is a new and growing jewellery business. Our pieces feature a quality coated
            finish — not fine jewellery, gold, or anti-tarnish plated. Product photos are as
            accurate as we can make them, but slight variations in colour or finish may occur.
          </p>
        </section>

        <section>
          <h2 className="text-charcoal font-medium mb-2">Orders &amp; Payment</h2>
          <p>
            Placing an order is a request to purchase, confirmed once payment is received. We
            currently accept prepaid orders only, paid via the QR code shared after checkout — we
            do not offer cash on delivery. Prices and product availability are subject to change
            without notice.
          </p>
        </section>

        <section>
          <h2 className="text-charcoal font-medium mb-2">Returns &amp; Refunds</h2>
          <p>
            See our{' '}
            <a href="/returns-refunds" className="text-gold-dark underline">
              Returns &amp; Refunds
            </a>{' '}
            page for full details on eligibility and how refunds are processed.
          </p>
        </section>

        <section>
          <h2 className="text-charcoal font-medium mb-2">Limitation of Liability</h2>
          <p>
            We do our best to describe and photograph our products accurately and to fulfil orders
            promptly. Glimmora isn't liable for delays outside our control (such as courier
            delays) or for normal wear on coated jewellery over time.
          </p>
        </section>

        <section>
          <h2 className="text-charcoal font-medium mb-2">Contact</h2>
          <p>Questions about these terms? Reach out to us on WhatsApp or email — details in the footer.</p>
        </section>
      </div>
    </div>
  )
}
