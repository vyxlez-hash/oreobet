export function Countdown({seconds}:{seconds:number}) {
  return <div className="countdown"><span>NEXT ROUND</span><strong>{String(seconds).padStart(2,"0")}</strong></div>
}
