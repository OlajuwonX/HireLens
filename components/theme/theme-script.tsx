export const THEME_STORAGE_KEY = "hirelens-theme";

export const DEFAULT_THEME = "dark";

const script = `(function(){try{var k="${THEME_STORAGE_KEY}";var s=localStorage.getItem(k)||"${DEFAULT_THEME}";var d=s==="dark"||(s==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
