import {toPublicQuestion,type InternalQuestion,type PublicQuestion} from "../contracts/public-question";

export interface WorkCardSource {
  question:InternalQuestion;
  published:boolean;
  activeAdoptions:number;
}
export interface PublicWorkCard {
  question:PublicQuestion;
  availability:"unclaimed"|"adopted";
}
/** Public cards never contain a participant identity, draft, or exact adoption count. */
export function projectPublicWorkCards(sources:readonly WorkCardSource[]):PublicWorkCard[] {
  return sources.filter(source=>source.published).map(source=>{
    if(!Number.isSafeInteger(source.activeAdoptions) || source.activeAdoptions<0)
      throw new Error("Invalid adoption state");
    return {question:toPublicQuestion(source.question),
      availability:source.activeAdoptions>0?"adopted":"unclaimed"};
  });
}
