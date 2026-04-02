import { useState } from "react"
import FounderForm from "./FounderForm"
import Results from "./Results"

export default function App() {
  const [matches, setMatches] = useState(null)
  const [profile, setProfile] = useState(null)

  return (
    <div style={{maxWidth:780, margin:"0 auto", padding:"2rem", fontFamily:"system-ui, sans-serif"}}>
      <div style={{marginBottom:24}}>
        <h1 style={{color:"#6b21a8", margin:0, fontSize:28}}>FundNest</h1>
        <p style={{color:"#666", margin:"6px 0 0"}}>
          Find every grant, VC fund, and program that fits your profile — in seconds.
        </p>
      </div>
      {!matches
        ? <FounderForm onResults={(p, m) => { setProfile(p); setMatches(m) }} />
        : <Results matches={matches} profile={profile} onReset={() => setMatches(null)} />
      }
    </div>
  )
}