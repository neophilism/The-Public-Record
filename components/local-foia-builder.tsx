"use client";
import {useState} from "react";
import {renderLocalDraftText,validateLocalDraft,type LocalRequestDraft} from "../lib/templates/plaintext-export";
const initial:LocalRequestDraft={agencyName:"",description:"",startDate:"",endDate:"",feeCapUsd:25,electronicCopies:true};
const field={display:"grid",gap:6,marginBottom:16} as const;
const control={font:"inherit",padding:10,border:"1px solid #8d9896",borderRadius:6,width:"100%",boxSizing:"border-box" as const};
export default function LocalFoiaBuilder(){
  const [draft,setDraft]=useState(initial);
  const [confirmed,setConfirmed]=useState(false);
  const update=<K extends keyof LocalRequestDraft>(key:K,value:LocalRequestDraft[K])=>setDraft(d=>({...d,[key]:value}));
  const problems=validateLocalDraft(draft);
  const ready=problems.length===0 && confirmed;
  const text=problems.length===0?renderLocalDraftText(draft):"";
  const download=()=>{
    if(!ready)return;
    const blob=new Blob([text],{type:"text/plain;charset=utf-8"});
    const link=document.createElement("a"), url=URL.createObjectURL(blob);
    link.href=url;link.download="public-record-foia-draft.txt";
    document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
  };
  const copy=async()=>{if(ready)await navigator.clipboard.writeText(text)};
  return <section aria-label="Local records request draft">
    <p className="nonprint">Your entries stay in this browser tab. This preview does not save them, create an account, or submit them to any agency.</p>
    <div className="nonprint">
      <label style={field}>Federal agency name (verify separately)
        <input style={control} value={draft.agencyName} maxLength={200} onChange={e=>update("agencyName",e.target.value)} autoComplete="off"/>
      </label>
      <label style={field}>Identify existing agency records, not an explanation
        <textarea style={control} rows={5} maxLength={6000} value={draft.description} onChange={e=>update("description",e.target.value)} />
      </label>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14}}>
        <label style={field}>Start date
          <input style={control} type="date" value={draft.startDate} onChange={e=>update("startDate",e.target.value)}/>
        </label>
        <label style={field}>End date
          <input style={control} type="date" value={draft.endDate} onChange={e=>update("endDate",e.target.value)}/>
        </label>
      </div>
      <label style={field}>Maximum fees before notifying you (USD)
        <input style={control} type="number" min={0} max={10000} step={0.01} value={draft.feeCapUsd}
          onChange={e=>update("feeCapUsd",Number(e.target.value))}/>
      </label>
      <label style={{display:"flex",gap:10,alignItems:"center",marginBottom:20}}>
        <input type="checkbox" checked={draft.electronicCopies} onChange={e=>update("electronicCopies",e.target.checked)}/>
        Request electronic copies when available
      </label>
      <ul aria-live="polite">{problems.map(problem=><li key={problem}>{problem}</li>)}</ul>
      <label style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:18}}>
        <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>
        I understand that this is only a draft. I must check the current official agency submission instructions and file personally.
      </label>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:25}}>
        <button onClick={()=>void copy()} disabled={!ready} type="button">Copy draft</button>
        <button onClick={download} disabled={!ready} type="button">Save text</button>
        <button onClick={()=>window.print()} disabled={!ready} type="button">Print or save PDF</button>
      </div>
    </div>
    {ready && <section className="print-only-record"><h2>Draft to review</h2><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontFamily:"inherit",lineHeight:1.5}}>{text}</pre></section>}
  </section>;
}
