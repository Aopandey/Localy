import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Store,
  MessageCircle,
  CalendarCheck,
  MapPin,
} from "lucide-react";
export function DemandHero() {
  return (
    <section className="demand-hero">
      <div className="hero-copy">
        <div className="hero-eyebrow">
          <Sparkles size={14} />A LITTLE LOCAL INTELLIGENCE
        </div>
        <h2>
          Your next customer is already
          <br className="desktop-break" /> in the neighborhood.
        </h2>
        <p>
          Find local demand. Match it to your services.
          <br />
          Let good conversations grow your business.
        </p>
        <Link href="/community" className="button button-primary">
          Explore your community
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="radar-art" aria-hidden="true">
        <div className="radar-grid" />
        <div className="radar-ring radar-ring-1" />
        <div className="radar-ring radar-ring-2" />
        <div className="radar-ring radar-ring-3" />
        <div className="radar-center">
          <Store size={30} />
        </div>
        <div className="radar-orbit orbit-one">
          <MessageCircle size={20} />
        </div>
        <div className="radar-orbit orbit-two">
          <MapPin size={20} />
        </div>
        <div className="radar-orbit orbit-three">
          <CalendarCheck size={20} />
        </div>
        <div className="radar-avatar radar-avatar-one">AM</div>
        <div className="radar-avatar radar-avatar-two">JC</div>
        <div className="radar-label">
          <span className="status-dot" />
          New opportunity nearby<span className="radar-match">96% match</span>
        </div>
      </div>
    </section>
  );
}
