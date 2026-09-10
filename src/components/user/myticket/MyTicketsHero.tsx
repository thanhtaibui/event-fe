import { TicketCheck } from "lucide-react";

export default function MyTicketsHero() {
  return (
    <section className="myTicketsHero" aria-label="Tickets hero">
      <div className="myTicketsHero__left">
        <div className="myTicketsHero__leftColumns">
          <div className="myTicketsHero__iconWrap" aria-hidden="true">
            <TicketCheck className="myTicketsHero__icon" size={26} />
          </div>
          <div className="myTicketsHero__text">
            <div className="myTicketsHero__kicker">
              Your event wallet
            </div>
            <h1 className="myTicketsHero__title">My Tickets</h1>
            <p className="myTicketsHero__desc">
              Manage your upcoming and past tickets in one place.
            </p>
            <div className="myTicketsHero__stats" aria-label="Quick stats">
              <div className="myTicketsHero__stat">
                <div className="myTicketsHero__statValue">3</div>
                <div className="myTicketsHero__statLabel">Tickets</div>
              </div>
              <div className="myTicketsHero__stat">
                <div className="myTicketsHero__statValue">2</div>
                <div className="myTicketsHero__statLabel">Upcoming</div>
              </div>
              <div className="myTicketsHero__stat">
                <div className="myTicketsHero__statValue">1</div>
                <div className="myTicketsHero__statLabel">Past</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="myTicketsHero__right" aria-hidden="true">
        <img
          className="myTicketsHero__image"
          src="/bg-ticket.png"
          alt=""
        />
      </div>
    </section>
  );
}
