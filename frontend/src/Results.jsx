import { useState, useEffect } from "react"
import axios from "axios"

const typeColors = {
  grant:       {bg:"#dcfce7", text:"#15803d"},
  vc:          {bg:"#dbeafe", text:"#1d4ed8"},
  government:  {bg:"#fef9c3", text:"#a16207"},
  accelerator: {bg:"#f3e8ff", text:"#7c3aed"},
}

const statusOptions = ["saved", "applied", "rejected", "funded"]
const statusColors = {
  saved:    {bg:"#f3f4f6", text:"#374151"},
  applied:  {bg:"#dbeafe", text:"#1d4ed8"},
  rejected: {bg:"#fee2e2", text:"#dc2626"},
  funded:   {bg:"#dcfce7", text:"#15803d"},
}

const STORAGE_KEY = "fundnest_saved"

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") } catch { return {} }
}

function saveToDB(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export default function Results({ matches, profile, onReset }) {
  const [drafts, setDrafts]     = useState({})
  const [loading, setLoading]   = useState({})
  const [saved, setSaved]       = useState(loadSaved)
  const [activeTab, setActiveTab] = useState("matches")

  useEffect(() => { saveToDB(saved) }, [saved])

  const toggleSave = (fund) => {
    setSaved(prev => {
      if (prev[fund.id]) {
        const next = {...prev}; delete next[fund.id]; return next
      }
      return {...prev, [fund.id]: { ...fund, status: "saved", savedAt: Date.now() }}
    })
  }

  const updateStatus = (id, status) => {
    setSaved(prev => ({...prev, [id]: {...prev[id], status}}))
  }

  const getDraft = async (fund) => {
    setLoading(l => ({...l, [fund.id]: true}))
    try {
      const res = await axios.post("http://localhost:8000/draft", {
        profile, fund_name: fund.name, fund_description: fund.description
      })
      setDrafts(d => ({...d, [fund.id]: res.data.draft}))
    } finally {
      setLoading(l => ({...l, [fund.id]: false}))
    }
  }

  const savedList = Object.values(saved)

  const tabBtn = (id, label, count) => (
    <button onClick={() => setActiveTab(id)} style={{
      padding:"8px 20px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:500, fontSize:14,
      background: activeTab === id ? "#6b21a8" : "#f3f4f6",
      color: activeTab === id ? "#fff" : "#374151"
    }}>
      {label} {count > 0 && <span style={{
        background: activeTab === id ? "rgba(255,255,255,0.3)" : "#e5e7eb",
        color: activeTab === id ? "#fff" : "#6b21a8",
        borderRadius:20, padding:"1px 7px", fontSize:12, marginLeft:4
      }}>{count}</span>}
    </button>
  )

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <div>
          <h2 style={{margin:0, color:"#6b21a8"}}>
            {activeTab === "matches" ? `${matches.length} funding matches found` : `${savedList.length} saved funds`}
          </h2>
          <p style={{margin:"4px 0 0", color:"#666", fontSize:14}}>
            {profile.name} · {profile.location}
          </p>
        </div>
        <button onClick={onReset} style={{
          background:"none", border:"1px solid #6b21a8", color:"#6b21a8",
          padding:"7px 16px", borderRadius:8, cursor:"pointer"
        }}>← New search</button>
      </div>

      {/* Tabs */}
      <div style={{display:"flex", gap:8, marginBottom:20}}>
        {tabBtn("matches", "Matches", matches.length)}
        {tabBtn("saved", "Saved & Tracking", savedList.length)}
      </div>

      {/* Matches Tab */}
      {activeTab === "matches" && (
        <div>
          {matches.length === 0 && (
            <div style={{textAlign:"center", padding:40, color:"#666"}}>
              <p>No strong matches found. Try adjusting your stage or sector.</p>
            </div>
          )}
          {matches.map(m => <FundCard key={m.id} m={m} saved={saved} profile={profile}
            onSave={toggleSave} onDraft={getDraft} draft={drafts[m.id]} draftLoading={loading[m.id]} />)}
        </div>
      )}

      {/* Saved Tab */}
      {activeTab === "saved" && (
        <div>
          {savedList.length === 0 && (
            <div style={{textAlign:"center", padding:40, color:"#666"}}>
              <p>No saved funds yet. Bookmark funds from your matches to track them here.</p>
            </div>
          )}
          {savedList.map(m => (
            <div key={m.id} style={{
              border:"1px solid #e5e7eb", borderRadius:12, padding:18, marginBottom:14, background:"#fff"
            }}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                <div>
                  <h3 style={{margin:"0 0 6px", fontSize:17}}>{m.name}</h3>
                  <div style={{display:"flex", gap:8, alignItems:"center"}}>
                    <span style={{
                      background: (typeColors[m.type]||{bg:"#f3f4f6"}).bg,
                      color: (typeColors[m.type]||{text:"#374151"}).text,
                      padding:"2px 10px", borderRadius:20, fontSize:12, fontWeight:500
                    }}>{m.type}</span>
                    <span style={{color:"#666", fontSize:13}}>{m.amount}</span>
                  </div>
                </div>
                {/* Status selector */}
                <div style={{display:"flex", gap:6, flexWrap:"wrap", justifyContent:"flex-end"}}>
                  {statusOptions.map(s => (
                    <button key={s} onClick={() => updateStatus(m.id, s)} style={{
                      padding:"4px 10px", borderRadius:20, border:"none", cursor:"pointer",
                      fontSize:12, fontWeight:500,
                      background: m.status === s ? statusColors[s].bg : "#f9fafb",
                      color: m.status === s ? statusColors[s].text : "#9ca3af",
                      outline: m.status === s ? `2px solid ${statusColors[s].text}` : "none"
                    }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                  ))}
                </div>
              </div>

              <p style={{color:"#555", margin:"10px 0 8px", fontSize:14, lineHeight:1.5}}>
                {m.description}
              </p>

              <div style={{display:"flex", gap:10, alignItems:"center"}}>
                <a href={m.url} target="_blank" rel="noreferrer"
                  style={{color:"#6b21a8", fontSize:13, fontWeight:500}}>
                  View opportunity →
                </a>
                <span style={{color:"#d1d5db"}}>|</span>
                <span style={{fontSize:13, color:"#666"}}>Deadline: {m.deadline}</span>
                <button onClick={() => toggleSave(m)}
                  style={{marginLeft:"auto", background:"#fee2e2", color:"#dc2626",
                    border:"none", padding:"5px 12px", borderRadius:8, cursor:"pointer", fontSize:13}}>
                  ✕ Remove
                </button>
              </div>
            </div>
          ))}

          {/* Summary stats */}
          {savedList.length > 0 && (
            <div style={{
              marginTop:16, padding:16, background:"#faf5ff",
              border:"1px solid #e9d5ff", borderRadius:12,
              display:"flex", gap:24
            }}>
              {statusOptions.map(s => (
                <div key={s} style={{textAlign:"center"}}>
                  <div style={{fontSize:22, fontWeight:700, color:"#6b21a8"}}>
                    {savedList.filter(f => f.status === s).length}
                  </div>
                  <div style={{fontSize:12, color:"#666", textTransform:"capitalize"}}>{s}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FundCard({ m, saved, profile, onSave, onDraft, draft, draftLoading }) {
  const tc = typeColors[m.type] || {bg:"#f3f4f6", text:"#374151"}
  const isSaved = !!saved[m.id]

  return (
    <div style={{border:"1px solid #e5e7eb", borderRadius:12, padding:18, marginBottom:14, background:"#fff"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
        <div>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:6}}>
            <h3 style={{margin:0, fontSize:17}}>{m.name}</h3>
            {m.is_best_match && (
              <span style={{background:"#fef9c3", color:"#a16207",
                padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700}}>
                ⭐ Best Match
              </span>
            )}
          </div>
          <span style={{background:tc.bg, color:tc.text,
            padding:"2px 10px", borderRadius:20, fontSize:12, fontWeight:500}}>{m.type}</span>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:22, fontWeight:700, color:"#6b21a8"}}>{m.score}%</div>
          <div style={{color:"#555", fontSize:13}}>match</div>
          <div style={{color:"#374151", fontSize:13, fontWeight:500}}>{m.amount}</div>
        </div>
      </div>

      <p style={{color:"#555", margin:"10px 0 8px", fontSize:14, lineHeight:1.5}}>{m.description}</p>

      <div style={{display:"flex", gap:6, flexWrap:"wrap", marginBottom:12}}>
        {m.match_reasons.map((r,i) => (
          <span key={i} style={{background:"#f3e8ff", color:"#6b21a8",
            padding:"3px 10px", borderRadius:20, fontSize:12}}>✓ {r}</span>
        ))}
      </div>

      <div style={{display:"flex", gap:10, alignItems:"center", flexWrap:"wrap"}}>
        <a href={m.url} target="_blank" rel="noreferrer"
          style={{color:"#6b21a8", fontSize:13, fontWeight:500}}>View opportunity →</a>
        <span style={{color:"#d1d5db"}}>|</span>
        <span style={{fontSize:13, color:"#666"}}>Deadline: {m.deadline}</span>

        <div style={{marginLeft:"auto", display:"flex", gap:8}}>
          {/* Bookmark button */}
          <button onClick={() => onSave(m)} style={{
            background: isSaved ? "#faf5ff" : "#f9fafb",
            color: isSaved ? "#6b21a8" : "#6b7280",
            border: isSaved ? "1px solid #e9d5ff" : "1px solid #e5e7eb",
            padding:"5px 12px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:500
          }}>
            {isSaved ? "🔖 Saved" : "🔖 Save"}
          </button>

          {/* Draft button */}
          <button onClick={() => onDraft(m)} disabled={!!draftLoading} style={{
            background:"#6b21a8", color:"#fff", border:"none",
            padding:"6px 14px", borderRadius:8,
            cursor: draftLoading ? "not-allowed" : "pointer", fontSize:13
          }}>
            {draftLoading ? "Drafting..." : "✍ Draft my application"}
          </button>
        </div>
      </div>

      {draft && (
        <div style={{marginTop:12, background:"#faf5ff",
          border:"1px solid #e9d5ff", borderRadius:8, padding:14}}>
          <div style={{fontWeight:500, fontSize:13, color:"#6b21a8", marginBottom:6}}>
            Your personalized application intro:
          </div>
          <p style={{margin:0, color:"#374151", lineHeight:1.7, fontSize:14}}>{draft}</p>
        </div>
      )}
    </div>
  )
}