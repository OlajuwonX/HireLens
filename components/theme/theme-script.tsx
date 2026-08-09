export const THEME_STORAGE_KEY = "hirelens-theme";

const script = `(function(){try{var k="${THEME_STORAGE_KEY}";var s=localStorage.getItem(k)||"system";var d=s==="dark"||(s==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
