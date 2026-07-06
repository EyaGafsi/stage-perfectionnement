
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { getAllFontFamiliesToLoad } from "@/condidat/resume/components/fonts/lib";

const FontsZhCSR = dynamic(() => import("@/condidat/resume/components/fonts/FontsZh"), {
  ssr: false,
});



/**
 * Empty component to lazy load non-english fonts CSS conditionally
 *
 * Reference: https://prawira.medium.com/react-conditional-import-conditional-css-import-110cc58e0da6
 */
export const NonEnglishFontsCSSLazyLoader = () => {
  const [shouldLoadFontsZh, setShouldLoadFontsZh] = useState(false);
useEffect(() => {
  if (getAllFontFamiliesToLoad().includes("NotoSansSC")) {
    // décaler la mise à jour pour éviter le warning
    setTimeout(() => setShouldLoadFontsZh(true), 0);
  }
}, []);


  return <>{shouldLoadFontsZh && <FontsZhCSR />}</>;
};
