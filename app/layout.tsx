import type { Metadata } from "next";
import type { ReactNode } from "react";
export const metadata: Metadata = {title:"The Public Record | Justice For All",description:"Investigate public questions through documentary evidence."};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body style={{margin:0,background:"#f8f8f6",color:"#182126",fontFamily:"system-ui,sans-serif"}}>{children}</body></html>}
