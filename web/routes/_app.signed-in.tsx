import { GameBrowser } from "@/components/app/GameBrowser";
import { useOutletContext } from "react-router";
import type { AuthOutletContext } from "./_app";

export default function () {
  const { user } = useOutletContext<AuthOutletContext>();
  
  return <GameBrowser />;
}