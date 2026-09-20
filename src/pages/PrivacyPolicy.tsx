export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <p className="eyebrow mb-2">Customer Care</p>
      <h1 className="font-logo text-3xl mb-8">Privacy Policy</h1>

      <div className="flex flex-col gap-6 text-sm text-charcoal/70 leading-relaxed">
        <p>
          This page explains what information Glimmora collects when you use this site, and how
          it's used. By using glimmora.in, you agree to this policy.
        </p>

        <section>
          <h2 className="text-charcoal font-medium mb-2">Information We Collect</h2>
          <p>When you create an account and place an order, we collect:</p>
          <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
            <li>Your name and email address (used to log you in)</li>
            <li>Your WhatsApp number (used to send order updates)</li>
            <li>Your shipping address (used to deliver your order)</li>
            <li>Your order and review history</li>
          </ul>
          <p className="mt-2">
            Items you add to your cart before logging in are stored locally in your browser, not
            on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-charcoal font-medium mb-2">How We Use Your Information</h2>
          <p>
            We use your information to process and deliver your orders, send you order and
            payment updates over WhatsApp, and respond to questions you send us. We do not sell
            your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-charcoal font-medium mb-2">Where Your Data Is Stored</h2>
          <p>
            Your data is stored securely with Supabase, our backend and database provider. Order
            communication happens over WhatsApp.
          </p>
        </section>

        <section>
          <h2 className="text-charcoal font-medium mb-2">Cookies & Local Storage</h2>
          <p>
            We use your browser's local storage to keep essential things working — your cart, your
            wishlist, and your login session. These aren't used for advertising or tracking, and
            they stay on your device rather than being sent to third parties. We don't currently
            use analytics or advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-charcoal font-medium mb-2">Your Choices</h2>
          <p>
            You can review your order history anytime from your account. To update or delete your
            information, contact us on WhatsApp or email — details in the footer.
          </p>
        </section>
      </div>
    </div>
  )
}
