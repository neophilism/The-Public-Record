import {NextResponse} from "next/server";
export function GET(){return NextResponse.json({service:"the-public-record",status:"scaffold",production_ready:false},{headers:{"Cache-Control":"no-store"}})}
