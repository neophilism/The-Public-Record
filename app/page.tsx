import Link from "next/link";
export default function Home(){return <main style={{maxWidth:880,margin:"auto",padding:"72px 24px"}}>
  <p style={{letterSpacing:3}}>JUSTICE FOR ALL</p>
  <h1 style={{fontSize:"clamp(2.4rem,6vw,4.5rem)"}}>The Public Record</h1>
  <p style={{fontSize:20,lineHeight:1.6}}>Public questions. Documentary evidence. Public accountability.</p>
  <p role="status" style={{background:"#e8ece9",padding:16,borderRadius:8}}>
    Early development preview: accounts, private evidence submissions, agency integration and archive publication are not yet enabled.
  </p>
  <section style={{border:"1px solid #c4ceca",padding:22,borderRadius:12,marginTop:25}}>
    <h2>Prepare your own FOIA request</h2>
    <p>Draft a records request locally, then verify the agency's instructions and file it yourself. Your draft isn't uploaded or saved by us.</p>
    <p><Link href="/public-record/prepare">Open private drafting preview →</Link></p>
  </section>
  <p><Link href="/public-record/work">Browse fictional work-card preview →</Link></p>
  <p style={{marginTop:36}}><a href="https://www.foia.gov/how-to.html">Official federal FOIA information</a></p>
</main>}
