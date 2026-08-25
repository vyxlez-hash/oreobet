import { Link } from "react-router-dom";
import { ArrowRight, Flame, ShieldCheck, Zap } from "lucide-react";
import { PageTitle } from "../App";
import { GameCard } from "../components/GameCard";
import { RainEvent } from "../components/RainEvent";

export function HomePage(){
  return <div>
    <section className="hero">
      <div className="hero-copy"><div className="eyebrow">OREOBET ORIGINALS</div><h1>Play sharp.<br/><span>Stay in the action.</span></h1><p>Premium game interfaces, realtime activity, and a clean competitive experience.</p><div className="hero-actions"><Link className="primary-btn" to="/games">Explore games <ArrowRight size={16}/></Link><Link className="secondary-btn" to="/wallet">Open wallet</Link></div></div>
      <div className="hero-orb"><div className="orb-core">O</div></div>
    </section>
    <RainEvent/>
    <PageTitle eyebrow="PLAY NOW" title="Featured games" sub="Fast rounds, clean controls, and smooth animations."/>
    <div className="game-grid">{["Coinflip","Crash","Mines","Blackjack","Roulette"].map((g,i)=><GameCard key={g} game={g} tag={i<2?"HOT":undefined}/>)}</div>
    <div className="trust-row"><span><Zap size={15}/> Fast interface</span><span><ShieldCheck size={15}/> Secure state handling</span><span><Flame size={15}/> Live activity</span></div>
  </div>
}
