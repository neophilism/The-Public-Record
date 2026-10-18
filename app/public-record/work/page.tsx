import Link from "next/link";
import synthetic from "@/fixtures/investigations.synthetic.json";
import {projectPublicWorkCards} from "@/lib/adoption/public-work-cards";
import type {InternalQuestion} from "@/lib/contracts/public-question";

export const metadata={title:"Browse work | The Public Record"};
export default function WorkPage() {
  const cards=projectPublicWorkCards(synthetic.questions.map(question=>({
    question:question as InternalQuestion,published:true,activeAdoptions:0
  })));
  return <main style={{maxWidth:900,margin:"auto",padding:"48px 20px"}}>
    <p><Link href="/">← The Public Record</Link></p>
    <h1>Explore public questions</h1>
    <p role="status">Synthetic preview: these are fictional examples. Adoption and saved drafts are not enabled.</p>
    <ul style={{listStyle:"none",padding:0,display:"grid",gap:18}}>
      {cards.map(card=><li key={card.question.id} style={{border:"1px solid #c4ceca",borderRadius:10,padding:20}}>
        <h2>{card.question.headline}</h2>
        <p>Work status: {card.availability}. No real participant or agency case is represented.</p>
        <p>Evidence status: {card.question.claim_status.replaceAll("_"," ")}.</p>
      </li>)}
    </ul>
  </main>;
}
