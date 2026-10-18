import type {Metadata} from "next";
import Link from "next/link";
import LocalFoiaBuilder from "../../../components/local-foia-builder";
import "./print.css";
export const metadata:Metadata={title:"Prepare a FOIA request | The Public Record",description:"Compose a self-filed FOIA request privately in your browser."};
export default function PreparePage(){
  return <main style={{maxWidth:820,margin:"auto",padding:"48px 20px"}}>
    <header className="nonprint"><Link href="/">← The Public Record</Link><p style={{letterSpacing:2,marginTop:25}}>CITIZEN-LED DOCUMENTATION</p>
      <h1 style={{fontSize:"clamp(2rem,5vw,3.3rem)",lineHeight:1.13}}>Prepare a records request</h1>
      <p>This is an early, local-only drafting tool, not a filing portal or legal advice. The federal FOIA process generally concerns existing agency records. This page does not contact a government system.</p>
      <p><a href="https://www.foia.gov/how-to.html" target="_blank" rel="noopener noreferrer">Check current official FOIA filing instructions ↗</a></p>
    </header>
    <LocalFoiaBuilder/>
    <p className="nonprint"><Link href="/public-record/self-file">How to file your draft yourself →</Link></p>
    <footer className="nonprint" style={{marginTop:35,fontSize:14,color:"#465451"}}>
      <p>Private evidence storage, verified agency destinations, accounts, and automatic correspondence tracking are not yet active. Avoid entering confidential details in this early preview.</p>
    </footer>
  </main>;
}
