import { useState } from "react"
import axios from "axios"

const STEPS = [
  { title: "About you", subtitle: "Tell us who you are" },
  { title: "Your identity", subtitle: "Help us find niche funding just for you" },
  { title: "Your business", subtitle: "Tell us what you're building" },
  { title: "Funding needs", subtitle: "What are you looking for?" },
]

const sectors = ["EdTech","HealthTech","FinTech","CleanTech","AgriTech","RetailTech",
  "Social Impact","AI / ML","Cybersecurity","Hardware / IoT","Consumer Goods","Other"]
const stages = ["Idea / Pre-revenue","Early (< $50K revenue)","Seed ($50K–$500K)",
  "Growth ($500K–$2M)","Scale ($2M+)"]
const entityTypes = ["Sole Proprietorship","LLC","C-Corp","S-Corp","Nonprofit","Not yet registered"]
const businessModels = ["B2B (sell to businesses)","B2C (sell to consumers)",
  "B2B2C","Marketplace","SaaS / Subscription","Nonprofit / Grant-funded","Other"]
const fundingTypes = ["Grants (no repayment)","Venture Capital","Angel Investment",
  "Government Programs","Accelerators / Incubators","Microloans","All of the above"]

export default function FounderForm({ onResults }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    // Step 1 — About you
    name: "", email: "", location: "", entity_type: "LLC", years_in_business: "",
    // Step 2 — Identity
    gender: "woman", ethnicity: "", is_parent: false, is_veteran: false,
    is_immigrant: false, is_disabled: false, is_lgbtq: false,
    // Step 3 — Business
    sector: "EdTech", stage: "Early (< $50K revenue)", business_model: "B2C (sell to consumers)",
    team_size: "1", revenue: 80000, description: "", problem_solved: "", target_market: "",
    // Step 4 — Funding
    funding_needed: 200000, funding_types: [], timeline: "3–6 months", prior_funding: "None",
    use_of_funds: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const u = (k, v) => setForm(f => ({...f, [k]: v}))
  const toggleFundingType = (t) => {
    setForm(f => ({...f, funding_types:
      f.funding_types.includes(t)
        ? f.funding_types.filter(x => x !== t)
        : [...f.funding_types, t]
    }))
  }

  const inp = {width:"100%", padding:"9px 12px", margin:"4px 0 14px", borderRadius:8,
    border:"1px solid #d1d5db", boxSizing:"border-box", fontSize:15, background:"#fff"}
  const lbl = {fontWeight:500, color:"#374151", fontSize:14, display:"block", marginBottom:2}
  const grid2 = {display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}
  const checkRow = (key, label) => (
    <label key={key} style={{display:"flex", alignItems:"center", gap:8,
      marginBottom:10, cursor:"pointer", fontSize:14, color:"#374151"}}>
      <input type="checkbox" checked={form[key]} onChange={e => u(key, e.target.checked)}
        style={{width:16, height:16, accentColor:"#6b21a8"}}/>
      {label}
    </label>
  )

  const canNext = () => {
    if (step === 0) return form.name && form.location
    if (step === 1) return form.gender && form.ethnicity
    if (step === 2) return form.description && form.problem_solved
    return form.use_of_funds
  }

  const submit = async () => {
    setError(null); setLoading(true)
    try {
      const res = await axios.post("http://localhost:8000/match", form)
      onResults(form, res.data.matches)
    } catch(e) {
      setError("Could not connect to backend. Is it running?")
    } finally { setLoading(false) }
  }

  return (
    <div style={{background:"#faf5ff", border:"1px solid #e9d5ff", borderRadius:12, padding:24}}>

      {/* Progress bar */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
          {STEPS.map((s, i) => (
            <div key={i} style={{flex:1, textAlign:"center"}}>
              <div style={{
                width:28, height:28, borderRadius:"50%", margin:"0 auto 4px",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:13, fontWeight:600,
                background: i < step ? "#6b21a8" : i === step ? "#6b21a8" : "#e9d5ff",
                color: i <= step ? "#fff" : "#9ca3af"
              }}>{i < step ? "✓" : i + 1}</div>
              <div style={{fontSize:11, color: i === step ? "#6b21a8" : "#9ca3af", fontWeight: i === step ? 600 : 400}}>
                {s.title}
              </div>
            </div>
          ))}
        </div>
        <div style={{height:4, background:"#e9d5ff", borderRadius:4}}>
          <div style={{height:"100%", background:"#6b21a8", borderRadius:4,
            width:`${((step) / (STEPS.length - 1)) * 100}%`, transition:"width 0.3s"}}/>
        </div>
      </div>

      <h2 style={{color:"#6b21a8", marginTop:0, fontSize:18}}>{STEPS[step].title}</h2>
      <p style={{color:"#666", marginTop:-8, marginBottom:16, fontSize:14}}>{STEPS[step].subtitle}</p>

      {/* Step 1 — About you */}
      {step === 0 && (
        <>
          <label style={lbl}>Full name *</label>
          <input style={inp} value={form.name} onChange={e=>u("name",e.target.value)} placeholder="e.g. Maria Garcia"/>

          <label style={lbl}>Email</label>
          <input style={inp} type="email" value={form.email} onChange={e=>u("email",e.target.value)} placeholder="e.g. maria@mycompany.com"/>

          <label style={lbl}>Location (City, State) *</label>
          <input style={inp} value={form.location} onChange={e=>u("location",e.target.value)} placeholder="e.g. Austin, Texas"/>

          <div style={grid2}>
            <div>
              <label style={lbl}>Entity type</label>
              <select style={inp} value={form.entity_type} onChange={e=>u("entity_type",e.target.value)}>
                {entityTypes.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Years in business</label>
              <select style={inp} value={form.years_in_business} onChange={e=>u("years_in_business",e.target.value)}>
                <option value="">Select</option>
                {["Less than 1 year","1–2 years","3–5 years","5–10 years","10+ years"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </>
      )}

      {/* Step 2 — Identity */}
      {step === 1 && (
        <>
          <p style={{fontSize:13, color:"#6b21a8", background:"#f3e8ff",
            padding:"10px 14px", borderRadius:8, marginBottom:16}}>
            💡 Women, women of color, veterans, parents, and other underrepresented founders have
            <strong> hundreds of niche funding sources</strong> unavailable to others.
            The more you share, the more matches we find.
          </p>

          <div style={grid2}>
            <div>
              <label style={lbl}>Gender *</label>
              <select style={inp} value={form.gender} onChange={e=>u("gender",e.target.value)}>
                <option value="woman">Woman</option>
                <option value="man">Man</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Ethnicity / background *</label>
              <input style={inp} value={form.ethnicity} onChange={e=>u("ethnicity",e.target.value)}
                placeholder="e.g. Latina, Black, Asian, White"/>
            </div>
          </div>

          <label style={lbl}>Which of these apply to you?</label>
          <div style={{background:"#fff", border:"1px solid #e9d5ff", borderRadius:8, padding:"12px 16px", marginBottom:14}}>
            {checkRow("is_parent", "I am a parent or caregiver")}
            {checkRow("is_veteran", "I am a veteran or active military")}
            {checkRow("is_immigrant", "I am an immigrant or first-generation American")}
            {checkRow("is_disabled", "I have a disability")}
            {checkRow("is_lgbtq", "I identify as LGBTQ+")}
          </div>
        </>
      )}

      {/* Step 3 — Business */}
      {step === 2 && (
        <>
          <div style={grid2}>
            <div>
              <label style={lbl}>Sector</label>
              <select style={inp} value={form.sector} onChange={e=>u("sector",e.target.value)}>
                {sectors.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Stage</label>
              <select style={inp} value={form.stage} onChange={e=>u("stage",e.target.value)}>
                {stages.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={grid2}>
            <div>
              <label style={lbl}>Business model</label>
              <select style={inp} value={form.business_model} onChange={e=>u("business_model",e.target.value)}>
                {businessModels.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Team size</label>
              <select style={inp} value={form.team_size} onChange={e=>u("team_size",e.target.value)}>
                {["Just me","2–3 people","4–10 people","10–25 people","25+ people"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <label style={lbl}>Annual revenue ($)</label>
          <input style={inp} type="number" value={form.revenue} onChange={e=>u("revenue",parseInt(e.target.value)||0)}/>

          <label style={lbl}>Describe your business *</label>
          <textarea style={{...inp, height:70}} value={form.description}
            onChange={e=>u("description",e.target.value)}
            placeholder="What does your company do and who does it serve?"/>

          <label style={lbl}>What problem are you solving? *</label>
          <textarea style={{...inp, height:70}} value={form.problem_solved}
            onChange={e=>u("problem_solved",e.target.value)}
            placeholder="What problem exists and how does your solution address it?"/>

          <label style={lbl}>Who is your target market?</label>
          <input style={inp} value={form.target_market} onChange={e=>u("target_market",e.target.value)}
            placeholder="e.g. Latina high school students in underserved communities"/>
        </>
      )}

      {/* Step 4 — Funding */}
      {step === 3 && (
        <>
          <div style={grid2}>
            <div>
              <label style={lbl}>Funding needed ($)</label>
              <input style={inp} type="number" value={form.funding_needed}
                onChange={e=>u("funding_needed",parseInt(e.target.value)||0)}/>
            </div>
            <div>
              <label style={lbl}>Timeline to raise</label>
              <select style={inp} value={form.timeline} onChange={e=>u("timeline",e.target.value)}>
                {["ASAP (< 1 month)","1–3 months","3–6 months","6–12 months","No rush"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <label style={lbl}>Prior funding received</label>
          <select style={inp} value={form.prior_funding} onChange={e=>u("prior_funding",e.target.value)}>
            {["None","Bootstrapped only","Friends & family","Won a grant","Angel investment",
              "VC-backed","Government grant","Crowdfunded"].map(s=><option key={s}>{s}</option>)}
          </select>

          <label style={lbl}>What types of funding are you open to?</label>
          <div style={{display:"flex", flexWrap:"wrap", gap:8, marginBottom:14}}>
            {fundingTypes.map(t => (
              <button key={t} onClick={() => toggleFundingType(t)} style={{
                padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:13,
                background: form.funding_types.includes(t) ? "#6b21a8" : "#f3f4f6",
                color: form.funding_types.includes(t) ? "#fff" : "#374151",
                fontWeight: form.funding_types.includes(t) ? 600 : 400
              }}>{t}</button>
            ))}
          </div>

          <label style={lbl}>What will you use the funding for? *</label>
          <textarea style={{...inp, height:80}} value={form.use_of_funds}
            onChange={e=>u("use_of_funds",e.target.value)}
            placeholder="e.g. Hire 2 engineers, expand to 3 new cities, build mobile app"/>

          {error && <p style={{color:"#dc2626", marginBottom:12}}>{error}</p>}
        </>
      )}

      {/* Navigation */}
      <div style={{display:"flex", justifyContent:"space-between", marginTop:8}}>
        {step > 0
          ? <button onClick={() => setStep(s => s - 1)} style={{
              background:"none", border:"1px solid #d1d5db", color:"#374151",
              padding:"10px 22px", borderRadius:8, cursor:"pointer", fontSize:15
            }}>← Back</button>
          : <div/>
        }
        {step < STEPS.length - 1
          ? <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} style={{
              background: canNext() ? "#6b21a8" : "#9ca3af", color:"#fff",
              padding:"10px 24px", border:"none", borderRadius:8,
              cursor: canNext() ? "pointer" : "not-allowed", fontSize:15, fontWeight:500
            }}>Next →</button>
          : <button onClick={submit} disabled={loading || !canNext()} style={{
              background: (loading || !canNext()) ? "#9ca3af" : "#6b21a8", color:"#fff",
              padding:"10px 24px", border:"none", borderRadius:8,
              cursor: (loading || !canNext()) ? "not-allowed" : "pointer", fontSize:15, fontWeight:500
            }}>{loading ? "Finding your matches..." : "Find My Funding →"}</button>
        }
      </div>
    </div>
  )
}