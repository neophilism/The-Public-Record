import Link from "next/link";
import {buildSelfFilingGuide} from "@/lib/filing/self-filing-guide";

export const metadata={title:"File your own request | The Public Record"};
export default function SelfFilingPage() {
  const guide=buildSelfFilingGuide(undefined,[],[]);
  return <main style={{maxWidth:820,margin:"auto",padding:"48px 20px"}}>
    <p><Link href="/public-record/prepare">← Back to your local draft</Link></p>
    <h1>File your request yourself</h1>
    <p role="status">{guide.notice}</p>
    <ol>{guide.steps.map(step=><li key={step} style={{marginBottom:14}}>{step}</li>)}</ol>
    <p><a href="https://www.foia.gov/how-to.html" target="_blank" rel="noopener noreferrer">
      Find current agency instructions on FOIA.gov ↗</a></p>
    <p>Agency-specific links will appear only after an editor verifies the exact destination and review date.</p>
  </main>;
}
