export default function EventFooterStats() {
  return (
    <section className="event-footer-stats" aria-label="Event newsletter">
      <h2>Never miss an event again</h2>
      <p>
        Subscribe to our weekly newsletter and get personalized recommendations,
        early-bird deals, and exclusive community invites delivered to your inbox.
      </p>
      <form className="event-footer-stats__form">
        <input type="email" placeholder="Your email address" aria-label="Email address" />
        <button type="submit">Subscribe</button>
      </form>
    </section>
  );
}
