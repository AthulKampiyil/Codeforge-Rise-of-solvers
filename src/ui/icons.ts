import {
  createElement,
  Circle,
  Trophy,
  Hammer,
  Axe,
  ShieldCheck,
  Map as MapGlyph,
  ScrollText,
  BookOpen,
  Settings,
  Plus,
  LocateFixed,
  Minus,
  Swords,
  UsersRound,
  ChevronRight,
  ShoppingBasket,
  X,
  Move,
  Heart,
  ArrowBigUp,
  Flag,
  MousePointer2,
  Tent,
  Users,
  Clock3,
  Star,
  LockKeyhole,
  ArrowRight,
  Save,
  Download,
  Upload,
  Coins,
  Castle,
  House,
  Pencil,
  Undo2,
  Redo2,
  LayoutGrid,
  Info,
  Sparkles,
  Wind,
  Timer,
  Play,
  Check,
  Layers,
  TriangleAlert,
  FlaskConical,
  RotateCcw,
  RotateCw,
  Zap,
  Target,
  Gauge,
  Radar,
  Ban,
  Anvil,
  PawPrint,
  Eye,
  Gem,
  Scan,
  HeartPulse,
  Waves,
  FastForward,
  Crown,
  Landmark,
  ListChecks,
} from 'lucide';
const icons = {
  Circle,
  Landmark,
  ListChecks,
  FastForward,
  Crown,
  Trophy,
  Hammer,
  Axe,
  ShieldCheck,
  Map: MapGlyph,
  ScrollText,
  BookOpen,
  Settings,
  Plus,
  LocateFixed,
  Minus,
  Swords,
  UsersRound,
  ChevronRight,
  ShoppingBasket,
  X,
  Move,
  Heart,
  ArrowBigUp,
  Flag,
  MousePointer2,
  Tent,
  Users,
  Clock3,
  Star,
  LockKeyhole,
  ArrowRight,
  Save,
  Download,
  Upload,
  Coins,
  Castle,
  House,
  Pencil,
  Undo2,
  Redo2,
  LayoutGrid,
  Info,
  Sparkles,
  Wind,
  Timer,
  Play,
  Check,
  Layers,
  TriangleAlert,
  FlaskConical,
  RotateCcw,
  RotateCw,
  Zap,
  Target,
  Gauge,
  Radar,
  Ban,
  Anvil,
  PawPrint,
  Eye,
  Gem,
  Scan,
  HeartPulse,
  Waves,
};
const cache = new Map<string, string>();
/**
 * Serialized Lucide glyph. Rendering builds a real SVG element, so each
 * (name, size) pair is built once and reused by every later HUD render.
 */
export function icon(name: string, size = 22) {
  const key = `${name}:${size}`;
  let markup = cache.get(key);
  if (markup !== undefined) return markup;
  let component = icons[name as keyof typeof icons];
  if (!component) {
    if (import.meta.env?.DEV) console.warn(`Unknown icon "${name}"; drawing a circle instead.`);
    component = icons.Circle;
  }
  const el = createElement(component);
  el.setAttribute('width', String(size));
  el.setAttribute('height', String(size));
  el.setAttribute('stroke-width', '2.4');
  el.setAttribute('aria-hidden', 'true');
  markup = el.outerHTML;
  cache.set(key, markup);
  return markup;
}
/** Whether a glyph name is registered (used by tests to catch silent fallbacks). */
export const hasIcon = (name: string) => name in icons;
export const coin = '<span class="resource-icon coin" aria-hidden="true">✦</span>';
export const elixir = '<span class="resource-icon elixir" aria-hidden="true"></span>';
export const darkElixir = '<span class="resource-icon dark" aria-hidden="true"></span>';
export const gem = '<span class="resource-icon gem" aria-hidden="true"></span>';
export const resource = (k: string) =>
  k === 'gold' ? coin : k === 'elixir' ? elixir : k === 'dark' ? darkElixir : gem;
