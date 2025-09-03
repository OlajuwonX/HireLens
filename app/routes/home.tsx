import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "HireLens" },
    { name: "description", content: "Analyse your resume." },
  ];
}

export default function Home() {
  return <Welcome />;
}
