import { useEffect } from "react";
import { Font } from "@react-pdf/renderer";
import { ENGLISH_FONT_FAMILIES } from "@/condidat/resume/components/fonts/constants";

export const useRegisterReactPDFFont = () => {
  useEffect(() => {
    Font.register({ family: "Roboto", fonts: [
      { src: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf" },
      { src: "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc9.ttf", fontWeight: "bold" },
    ]});
    Font.register({ family: "Lato", fonts: [
      { src: "https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXg.ttf" },
      { src: "https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwiPGQ.ttf", fontWeight: "bold" },
    ]});
    Font.register({ family: "Montserrat", fonts: [
      { src: "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXo.ttf" },
      { src: "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM73w5aXo.ttf", fontWeight: "bold" },
    ]});
    Font.register({ family: "OpenSans", fonts: [
      { src: "https://fonts.gstatic.com/s/opensans/v36/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0C24.ttf" },
      { src: "https://fonts.gstatic.com/s/opensans/v36/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjrwC24.ttf", fontWeight: "bold" },
    ]});
    Font.register({ family: "Raleway", fonts: [
      { src: "https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyC0IT4ttDfA.ttf" },
      { src: "https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyC0IT4ttDfB.ttf", fontWeight: "bold" },
    ]});
    Font.register({ family: "Caladea", fonts: [
      { src: "https://fonts.gstatic.com/s/caladea/v7/i7dPIFZ9Zz-WBtRtedDbYEF8RXi4EwQ.ttf" },
      { src: "https://fonts.gstatic.com/s/caladea/v7/i7dKIFZ9Zz-WBtRtedDbYFF8RXi4EwSsbg.ttf", fontWeight: "bold" },
    ]});
    Font.register({ family: "Lora", fonts: [
      { src: "https://fonts.gstatic.com/s/lora/v32/0QI6MX1D_JOxE7fSyjvRqSM.ttf" },
      { src: "https://fonts.gstatic.com/s/lora/v32/0QI6MX1D_JOxE7fSyjvRqSM.ttf", fontWeight: "bold" },
    ]});
    Font.register({ family: "RobotoSlab", fonts: [
      { src: "https://fonts.gstatic.com/s/robotoslab/v34/BngbUXZYTXPIvIBgJJSb6s3BzlRRfKOFbvjo0oSmb2Rm.ttf" },
      { src: "https://fonts.gstatic.com/s/robotoslab/v34/BngbUXZYTXPIvIBgJJSb6s3BzlRRfKOFbvjoDISmb2Rm.ttf", fontWeight: "bold" },
    ]});
    Font.register({ family: "PlayfairDisplay", fonts: [
      { src: "https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.ttf" },
      { src: "https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd3vUDQ.ttf", fontWeight: "bold" },
    ]});
    Font.register({ family: "Merriweather", fonts: [
      { src: "https://fonts.gstatic.com/s/merriweather/v30/u-440qyriQwlOrhSvowK_l5-fCZMdeX3rg.ttf" },
      { src: "https://fonts.gstatic.com/s/merriweather/v30/u-4n0qyriQwlOrhSvowK_l52xwNZWMf6hPvhPQ.ttf", fontWeight: "bold" },
    ]});
  }, []);
};

// ← garder tel quel, rien ne change
export const useRegisterReactPDFHyphenationCallback = (fontFamily: string) => {
  useEffect(() => {
    if (ENGLISH_FONT_FAMILIES.includes(fontFamily as any)) {
      Font.registerHyphenationCallback((word) => [word]);
    } else {
      Font.registerHyphenationCallback((word) =>
        word.split("").map((char) => [char, ""]).flat()
      );
    }
  }, [fontFamily]);
};