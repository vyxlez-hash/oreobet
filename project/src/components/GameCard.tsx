import { Heart, Play } from "lucide-react";
import { Link } from "react-router-dom";

export function GameCard({game, tag}:{game:string; tag?:string}) {
  return <Link to={`/games/${game.toLowerCase()}`} className="game-card">
    <div className={`game-art art-${game.toLowerCase()}`}>
      <span className="game-mark">{game === "Blackjack" ? "21" : game === "Coinflip" ? "H / T" : game[0]}</span>
      {tag && <span className="tag">{tag}</span>}
      <button className="favorite" onClick={e=>e.preventDefault()}><Heart size={16}/></button>
      <div className="play-overlay"><span><Play size={16} fill="currentColor"/> Play</span></div>
    </div>
    <div className="game-meta"><strong>{game}</strong><span>OREOBET Original</span></div>
  </Link>
}
