import { GameCard } from "../components/GameCard";
import { PageTitle } from "../App";

export function GamesPage(){
  return <section><PageTitle eyebrow="CASINO" title="All games" sub="Choose a game and jump straight in."/><div className="filter-row"><button className="filter active">All</button><button className="filter">Originals</button><button className="filter">Table</button><button className="filter">Instant</button><button className="filter">Live</button></div><div className="game-grid">{["Coinflip","Crash","Mines","Blackjack","Roulette","Dice"].map(g=><GameCard key={g} game={g}/>)}</div></section>
}
