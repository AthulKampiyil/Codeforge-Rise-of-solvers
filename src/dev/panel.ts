import { GameModel, type Save } from '../game/model';
import {
  BUILDINGS,
  BUILDING_KEYS,
  CAMPAIGN,
  MAX_TOWNHALL,
  SPELLS,
  SPELL_KEYS,
  TROOPS,
  TROOP_KEYS,
  maxTroopLevel,
  type BuildingKind,
  type SpellKind,
  type TroopKind,
} from '../game/data';
import { maxSpellLevelFor } from '../game/spell-progression';
import { NATIVE_CAMPAIGN } from '../game/native-campaign';
import {
  HERO_KINDS,
  HERO_SOURCE,
  ITEM_NAMES,
  PET_DISPLAY,
  PET_KINDS,
  itemMaxLevel,
  itemName,
  itemSlug,
  petMaxLevel,
  type HeroKind,
  type PetKind,
} from '../game/native-hero-data';
import { HERO_MAX_LEVEL } from '../game/heroes';
import { VillageScene } from '../game/scene';
import { DeveloperControls, type MaxVillageOptions } from './controls';
import { maxVillagePlan, plannedTotal } from './village';
import { readArmyConfigs, writeArmyConfig, deleteArmyConfig, type ArmyConfig } from './loadout';
import { deleteVillageSlot, readVillageSlots, type VillageSlot } from './slots';
import './style.css';

const checkpointKey = 'crown-clan-developer-checkpoint';
const TABS = ['village', 'army', 'levels', 'heroes', 'world', 'battle'] as const;
type Tab = (typeof TABS)[number];
const TAB_NAMES: Record<Tab, string> = {
  village: 'Village',
  army: 'Army',
  levels: 'Levels',
  heroes: 'Heroes',
  world: 'World',
  battle: 'Battle & save',
};
const escape = (value: string) =>
  value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function installDeveloperTools(model: GameModel, scene: VillageScene) {
  let saved: Save | undefined;
  try {
    saved = JSON.parse(sessionStorage.getItem(checkpointKey) ?? 'null') ?? undefined;
  } catch {
    /* A fresh checkpoint replaces malformed JSON. */
  }
  const controls = new DeveloperControls(model, saved);
  const remember = () => {
    try {
      sessionStorage.setItem(checkpointKey, JSON.stringify(controls.checkpointSave));
    } catch {
      /* The in-memory checkpoint still works when storage is unavailable. */
    }
  };
  remember();
  Object.assign(window, { __dev: controls });
  const launcher = document.createElement('button');
  launcher.className = 'developer-launch';
  launcher.textContent = 'DEV';
  launcher.title = 'Developer tools (Ctrl/⌘ Shift D)';
  launcher.setAttribute('aria-label', 'Open developer tools');
  const dialog = document.createElement('dialog');
  dialog.className = 'developer-panel';
  dialog.setAttribute('aria-labelledby', 'developer-title');
  let tab: Tab = 'village';
  let configs: ArmyConfig[] = readArmyConfigs();
  let villages: VillageSlot[] = readVillageSlots();

  const field = (name: string, label: string, value: number, max: number, min = 0) =>
    `<label>${label}<input name="${name}" type="number" min="${min}" max="${max}" step="1" value="${value}" required></label>`;
  const button = (action: string, label: string) =>
    `<button type="button" data-dev="${action}">${label}</button>`;
  const options = (entries: readonly (readonly [string, string])[], selected?: string) =>
    entries
      .map(
        ([value, label]) =>
          `<option value="${escape(value)}"${value === selected ? ' selected' : ''}>${escape(label)}</option>`,
      )
      .join('');
  const check = (name: string, label: string, on = true) =>
    `<label class="developer-check"><input name="${name}" type="checkbox"${on ? ' checked' : ''}>${label}</label>`;

  // ------------------------------------------------------------------ tabs
  const villageTab = () => {
    const tiers = Array.from({ length: MAX_TOWNHALL }, (_, i) => i + 1);
    const plan = controls.plan(model.townhallLevel);
    const summary = plan.entries
      .filter((entry) => entry.kind !== 'wall')
      .map((entry) => `${BUILDINGS[entry.kind].name} ×${entry.count} lv${entry.level}`)
      .join(' · ');
    return `<h2>Maxed village presets</h2>
      <p class="developer-note">Rebuild the village as a complete Town Hall: every building the tier allows, at its ceiling, on a fresh layout. Obstacles and saved layouts are cleared, and progress the new halls cannot support is reset.</p>
      <div class="developer-tiers">${tiers
        .map(
          (tier) =>
            `<button type="button" data-dev="maxtier" data-tier="${tier}"${tier === model.townhallLevel ? ' class="current"' : ''}>TH${tier}<small>${plannedTotal(maxVillagePlan(tier))}</small></button>`,
        )
        .join('')}</div>
      <form data-form="maxvillage" class="developer-actions">
        ${check('walls', 'Walls')}${check('research', 'Research')}${check('heroes', 'Heroes')}${check('army', 'Army')}${check('resources', 'Resources')}${check('campaign', 'Campaign stars', false)}
        ${field('tier', 'Town Hall', model.townhallLevel, MAX_TOWNHALL, 1)}<button>Build maxed village</button>
      </form>
      <p class="developer-note">Town Hall ${model.townhallLevel} holds ${plan.total} pieces. ${escape(summary)}</p>
      <h2>Saved villages</h2>
      <p class="developer-note">Keep whole villages in this browser and switch between them, customisation and all. Up to eight.</p>
      <div class="developer-actions">${
        villages.length
          ? villages
              .map(
                (slot, index) =>
                  `<span class="developer-config"><button type="button" data-dev="loadvillage" data-index="${index}">${escape(slot.name)} <small>TH${slot.townhall}</small></button><button type="button" data-dev="deletevillage" data-index="${index}" aria-label="Delete ${escape(slot.name)}">×</button></span>`,
              )
              .join('')
          : '<em>No saved villages yet.</em>'
      }</div>
      <form data-form="savevillage" class="developer-actions"><label>Name<input name="name" type="text" maxlength="32" placeholder="TH12 test base" required></label><button>Save this village</button></form>
      <h2>Buildings</h2>
      <form data-form="townhall" class="developer-actions">${field('townhall', 'Town Hall', model.townhallLevel, MAX_TOWNHALL, 1)}<button>Set Town Hall</button></form>
      <div class="developer-actions">${button('max', 'Max existing buildings at this TH')}${button('timers', 'Finish all timers')}${button('obstacles', 'Clear obstacles')}</div>
      <form data-form="building" class="developer-actions">
        <label>Building<select name="kind">${options(
          BUILDING_KEYS.filter((kind) => model.countOf(kind) > 0).map((kind) => [
            kind,
            `${BUILDINGS[kind].name} ×${model.countOf(kind)}`,
          ]),
        )}</select></label>
        ${field('level', 'Level', 1, 100, 1)}<button>Set every building of this kind</button>
      </form>
      <h2>Resources</h2>
      <form data-form="resources"><div class="developer-grid">${(
        ['gold', 'elixir', 'dark', 'gems'] as const
      )
        .map((k) =>
          field(
            k,
            k === 'dark' ? 'Dark elixir' : k[0].toUpperCase() + k.slice(1),
            model.state[k],
            999999999,
          ),
        )
        .join(
          '',
        )}</div><div class="developer-actions"><button>Set balances</button>${button('fill', 'Fill storage + 10,000 gems')}${button('ores', 'Fill ores')}</div></form>
      <form data-form="progress" class="developer-actions">${field('trophies', 'Trophies', model.state.trophies, 999999)}${field('xp', 'XP', model.state.xp, 99999999)}<button>Set trophies and XP</button></form>`;
  };

  const armyTab = () => {
    const unlocked = TROOP_KEYS.filter((kind) => model.troopUnlocked(kind));
    return `<h2>Fill the camps</h2>
      <p class="developer-note">Housing: ${model.armySize}/${model.capacity} troops, ${model.spellHousing}/${model.spellCapacity} spells. Filling uses only troops this village has unlocked.</p>
      <div class="developer-actions">${button('fillarmy', 'Fill camps with a mix')}${button('army20', '20 of each troop + 5 of each spell')}${button('clear', 'Clear army')}</div>
      <form data-form="single" class="developer-actions">
        <label>One troop<select name="troop">${options(
          (unlocked.length ? unlocked : TROOP_KEYS).map((kind) => [kind, TROOPS[kind].name]),
        )}</select></label><button>Fill camps with this troop</button>
      </form>
      <h2>Saved configurations</h2>
      <p class="developer-note">Kept in this browser, separate from the three in-game army slots.</p>
      <div class="developer-actions">${
        configs.length
          ? configs
              .map(
                (config, index) =>
                  `<span class="developer-config"><button type="button" data-dev="loadconfig" data-index="${index}">${escape(config.name)}</button><button type="button" data-dev="deleteconfig" data-index="${index}" aria-label="Delete ${escape(config.name)}">×</button></span>`,
              )
              .join('')
          : '<em>No saved configurations yet.</em>'
      }</div>
      <form data-form="saveconfig" class="developer-actions"><label>Name<input name="name" type="text" maxlength="32" placeholder="Mass dragons" required></label><button>Save current army</button></form>
      <h2>Exact counts</h2>
      <form data-form="army"><div class="developer-grid">${TROOP_KEYS.map((k) =>
        field(k, TROOPS[k].name, model.state.army[k], 9999),
      ).join(
        '',
      )}${SPELL_KEYS.map((k) => field(k, SPELLS[k].name, model.state.spells[k], 999)).join('')}</div><div class="developer-actions"><button>Set army</button></div></form>`;
  };

  const levelsTab = () =>
    `<h2>Research levels</h2>
      <p class="developer-note">Laboratory level ${model.laboratory?.level ?? 0}. Set any troop or spell directly; the ceiling shown on each field is the game's own.</p>
      <div class="developer-actions">${button('research', 'Max troop research')}${button('lab', 'Research to this laboratory')}</div>
      <form data-form="research"><h3>Troops</h3><div class="developer-grid">${TROOP_KEYS.map((k) =>
        field(
          `troop-${k}`,
          `${TROOPS[k].name} /${maxTroopLevel(k)}`,
          model.troopLevel(k),
          maxTroopLevel(k),
          1,
        ),
      ).join('')}</div>
      <h3>Spells</h3><div class="developer-grid">${SPELL_KEYS.map((k) =>
        field(
          `spell-${k}`,
          `${SPELLS[k].name} /${maxSpellLevelFor(k)}`,
          model.spellLevel(k),
          maxSpellLevelFor(k),
          1,
        ),
      ).join('')}</div>
      <div class="developer-actions"><button>Set research levels</button></div></form>`;

  const heroesTab = () => {
    const hall = model.heroHallLevel;
    const unlocked = HERO_KINDS.filter((kind) => model.heroUnlocked(kind));
    const house = model.petHouse?.level ?? 0;
    const pets = model.petProgress.levels;
    const gear = model.gear.levels;
    const owned = ITEM_NAMES.map(itemSlug).filter((slug) => gear[slug] !== undefined);
    return `<h2>Heroes</h2>
      <p class="developer-note">Hero Hall ${hall || '—'}, Blacksmith ${model.blacksmithLevel || '—'}, Pet House ${house || '—'}. Levels are capped by those halls; raise them on the Village tab first.</p>
      <div class="developer-actions">${button('king', 'Unlock King (TH4+)')}${button('maxheroes', 'Max heroes, pets and gear')}</div>
      <form data-form="hero" class="developer-actions">${field('kingLevel', 'King level', model.state.king?.level ?? 1, HERO_MAX_LEVEL, 1)}<button>Set King level</button></form>
      ${
        unlocked.length
          ? `<form data-form="heroes"><div class="developer-grid">${unlocked
              .map((kind) =>
                field(
                  `hero-${kind}`,
                  `${HERO_SOURCE[kind]} /${model.heroLevelMax(kind)}`,
                  model.heroProgress(kind)?.level ?? 1,
                  model.heroLevelMax(kind),
                  1,
                ),
              )
              .join(
                '',
              )}</div><div class="developer-actions"><button>Set hero levels</button></div></form>`
          : '<p class="developer-note">No heroes are unlocked in this village yet.</p>'
      }
      <h2>Pets</h2>
      ${
        house
          ? `<form data-form="pets"><div class="developer-grid">${PET_KINDS.filter(
              (kind) => pets[kind] !== undefined,
            )
              .map((kind) =>
                field(
                  `pet-${kind}`,
                  `${PET_DISPLAY[kind]} /${petMaxLevel(kind)}`,
                  pets[kind]!,
                  petMaxLevel(kind),
                  1,
                ),
              )
              .join(
                '',
              )}</div><div class="developer-actions"><button>Set pet levels</button></div></form>`
          : '<p class="developer-note">Build a Pet House to level pets.</p>'
      }
      <h2>Hero gear</h2>
      ${
        owned.length
          ? `<form data-form="item" class="developer-actions"><label>Item<select name="slug">${options(
              owned.map((slug) => [
                slug,
                `${itemName(slug)} (lv ${gear[slug]}/${itemMaxLevel(slug)})`,
              ]),
            )}</select></label>${field('level', 'Level', 1, 30, 1)}<button>Set item level</button></form>`
          : '<p class="developer-note">Build a Blacksmith to own and level hero gear.</p>'
      }`;
  };

  const worldTab = () =>
    `<h2>Campaign</h2>
      <p class="developer-note">${CAMPAIGN.length} Valley stages and ${NATIVE_CAMPAIGN.length} Goblin stages.</p>
      <div class="developer-actions">${button('campaign', 'Unlock campaign')}${button('stars3', 'Three-star every stage')}${button('stars0', 'Clear all stars')}</div>
      <form data-form="stage" class="developer-actions">
        <label>Stage<select name="stage">${options([
          ...CAMPAIGN.map(
            (stage, index) =>
              [`valley-v1:${index}`, `Valley ${index + 1} — ${stage.name}`] as const,
          ),
          ...NATIVE_CAMPAIGN.map(
            (stage, index) =>
              [`goblin-v1:${index}`, `Goblin ${index + 1} — ${stage.name}`] as const,
          ),
        ])}</select></label><button>Attack this stage</button>${button('practice', 'Practice on my own village')}
      </form>
      <p class="developer-note">Starting a stage unlocks the path to it, keeping any higher star counts already earned.</p>
      <h2>Time travel</h2>
      <p class="developer-note">Runs production, builders, research and hero upgrades forward by a span without touching the clock on the wall.</p>
      <div class="developer-actions">${button('hour', '+1 hour')}${button('day', '+1 day')}${button('week', '+7 days')}</div>
      <form data-form="time" class="developer-actions">${field('hours', 'Hours', 8, 2160, 1)}<button>Advance time</button></form>`;

  const battleTab = () =>
    `<h2>Attack</h2>
      <div class="developer-actions">${button('win', 'Finish with 3 stars')}${button('end', 'End with current result')}</div>
      <form data-form="damage" class="developer-actions">${field('percent', 'Destruction %', 50, 100, 1)}<button>Destroy to this percentage</button></form>
      <h2>Save file</h2>
      <p class="developer-note">The same JSON as Settings → Export village. Importing replaces this village after migrating and validating it.</p>
      <div class="developer-actions">${button('export', 'Copy village JSON')}${button('download', 'Download village JSON')}</div>
      <form data-form="import"><label>Paste a village<textarea name="save" rows="5" spellcheck="false" placeholder='{"version":4,...}'></textarea></label><div class="developer-actions"><button>Import village</button></div></form>`;

  const body: Record<Tab, () => string> = {
    village: villageTab,
    army: armyTab,
    levels: levelsTab,
    heroes: heroesTab,
    world: worldTab,
    battle: battleTab,
  };
  const render = () => {
    dialog.innerHTML = `<header><div><small>LOCAL TESTING</small><h1 id="developer-title">Developer tools</h1></div>${button('close', 'Close')}</header>
      <p class="developer-note">Changes save to this village. A checkpoint is kept in this tab across reloads. Resource and army edits can exceed normal capacity. Close this panel to resume play.</p>
      <div class="developer-actions">${button('checkpoint', 'Take checkpoint')}${button('restore', 'Restore checkpoint')}${button('refresh', 'Refresh values')}</div>
      <p class="developer-status" role="status">${model.battle ? 'Attack paused. Return home to edit your village.' : 'Village ready for testing.'}</p>
      <div class="developer-tabs" role="tablist">${TABS.map(
        (name) =>
          `<button type="button" role="tab" id="developer-tab-${name}" aria-controls="developer-body" data-dev="tab" data-tab="${name}" aria-selected="${name === tab}">${TAB_NAMES[name]}</button>`,
      ).join('')}</div>
      <div class="developer-body" id="developer-body" role="tabpanel" aria-labelledby="developer-tab-${tab}">${body[tab]()}</div>`;
  };

  let resume = false;
  const open = () => {
    if (dialog.open) return;
    configs = readArmyConfigs();
    villages = readVillageSlots();
    render();
    resume = scene.sys.isActive();
    if (resume) scene.scene.pause();
    dialog.showModal();
  };
  dialog.addEventListener('close', () => {
    if (resume) scene.scene.resume();
    resume = false;
    launcher.focus();
  });
  launcher.addEventListener('click', open);
  const run = (
    fn: () => void,
    message: string,
    focusTarget: Element | null = document.activeElement,
  ) => {
    try {
      const focusIndex = Array.from(
        dialog.querySelectorAll('button, input, select, textarea'),
      ).indexOf(focusTarget!);
      fn();
      render();
      dialog
        .querySelectorAll<HTMLElement>('button, input, select, textarea')
        [focusIndex]?.focus({ preventScroll: true });
      dialog.querySelector('.developer-status')!.textContent = message;
    } catch (error) {
      dialog.querySelector('.developer-status')!.textContent =
        error instanceof Error ? error.message : 'Change failed.';
    }
  };
  /** Options a max-village form carries; an unchecked box switches that part off. */
  const maxOptions = (form: HTMLFormElement): MaxVillageOptions => {
    const on = (name: string) =>
      !!form.querySelector<HTMLInputElement>(`[name="${name}"]`)?.checked;
    return {
      walls: on('walls'),
      research: on('research'),
      heroes: on('heroes'),
      army: on('army'),
      resources: on('resources'),
      campaign: on('campaign'),
    };
  };
  dialog.addEventListener('click', (event) => {
    const control = (event.target as HTMLElement).closest<HTMLElement>('[data-dev]');
    const action = control?.dataset.dev;
    if (!action) return;
    if (action === 'close') {
      dialog.close();
      return;
    }
    if (action === 'tab') {
      tab = (control!.dataset.tab as Tab) ?? 'village';
      render();
      dialog.querySelector<HTMLElement>(`[data-tab="${tab}"]`)?.focus({ preventScroll: true });
      return;
    }
    const actions: Record<string, () => void> = {
      checkpoint: () => {
        controls.checkpoint();
        remember();
      },
      restore: () => controls.restore(),
      refresh: () => {},
      fill: () => controls.fillResources(),
      ores: () => controls.fillOres(),
      maxtier: () => controls.maxTownHall(Number(control!.dataset.tier)),
      army20: () =>
        controls.setArmy(
          Object.fromEntries(TROOP_KEYS.map((k) => [k, 20])),
          Object.fromEntries(SPELL_KEYS.map((k) => [k, 5])),
        ),
      clear: () =>
        controls.setArmy(
          Object.fromEntries(TROOP_KEYS.map((k) => [k, 0])),
          Object.fromEntries(SPELL_KEYS.map((k) => [k, 0])),
        ),
      fillarmy: () => controls.fillArmy(),
      obstacles: () => controls.clearObstacles(),
      practice: () => controls.startStage(0, 'valley-v1', true),
      loadvillage: () => {
        const slot = villages[Number(control!.dataset.index)];
        if (!slot) throw Error('That saved village is gone.');
        controls.loadVillageSlot(slot.name);
      },
      deletevillage: () => {
        const slot = villages[Number(control!.dataset.index)];
        if (slot) villages = deleteVillageSlot(slot.name);
      },
      loadconfig: () => {
        const config = configs[Number(control!.dataset.index)];
        if (!config) throw Error('That configuration is gone.');
        controls.setArmy(config.army, config.spells);
      },
      deleteconfig: () => {
        const config = configs[Number(control!.dataset.index)];
        if (config) configs = deleteArmyConfig(config.name);
      },
      research: () => controls.maxResearch(),
      lab: () => controls.researchToLaboratory(),
      max: () => controls.maxBuildings(),
      timers: () => controls.finishTimers(),
      campaign: () => controls.unlockCampaign(),
      stars3: () => controls.setCampaignStars(3),
      stars0: () => controls.setCampaignStars(0),
      king: () => controls.unlockKing(),
      maxheroes: () => controls.maxHeroes(),
      hour: () => controls.advanceTime(3600),
      day: () => controls.advanceTime(24 * 3600),
      week: () => controls.advanceTime(7 * 24 * 3600),
      win: () => controls.endBattle(true),
      end: () => controls.endBattle(false),
      export: () => {
        void navigator.clipboard?.writeText(controls.exportSave());
      },
      download: () => {
        const url = URL.createObjectURL(
          new Blob([controls.exportSave()], { type: 'application/json' }),
        );
        const link = document.createElement('a');
        link.href = url;
        link.download = `crown-and-clan-th${model.townhallLevel}.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
    };
    if (actions[action])
      run(
        actions[action],
        action === 'restore'
          ? 'Checkpoint restored.'
          : action === 'checkpoint'
            ? 'Checkpoint saved for this tab.'
            : action === 'export'
              ? 'Village JSON copied to the clipboard.'
              : 'Done.',
        control,
      );
  });
  dialog.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const values: Record<string, string> = {};
    new FormData(form).forEach((value, key) => {
      values[key] = String(value);
    });
    const number = (key: string) => Number(values[key]);
    const group = <K extends string>(prefix: string, keys: readonly K[]) =>
      Object.fromEntries(
        keys.flatMap((key) =>
          values[`${prefix}-${key}`] === undefined
            ? []
            : [[key, Number(values[`${prefix}-${key}`])]],
        ),
      ) as Partial<Record<K, number>>;
    run(
      () => {
        switch (form.dataset.form) {
          case 'resources':
            controls.setResources({
              gold: number('gold'),
              elixir: number('elixir'),
              dark: number('dark'),
              gems: number('gems'),
            });
            break;
          case 'progress':
            controls.setProgress({ trophies: number('trophies'), xp: number('xp') });
            break;
          case 'maxvillage':
            controls.maxTownHall(number('tier'), maxOptions(form));
            break;
          case 'army':
            controls.setArmy(
              Object.fromEntries(TROOP_KEYS.map((k) => [k, number(k)])) as Record<
                TroopKind,
                number
              >,
              Object.fromEntries(SPELL_KEYS.map((k) => [k, number(k)])) as Record<
                SpellKind,
                number
              >,
            );
            break;
          case 'single':
            controls.fillArmy({ troop: values.troop as TroopKind });
            break;
          case 'savevillage':
            villages = controls.saveVillageSlot(values.name);
            break;
          case 'stage': {
            const [catalog, index] = values.stage.split(':');
            controls.startStage(Number(index), catalog as 'valley-v1' | 'goblin-v1');
            break;
          }
          case 'saveconfig':
            configs = writeArmyConfig({
              name: values.name,
              army: { ...model.state.army },
              spells: { ...model.state.spells },
            });
            break;
          case 'townhall':
            controls.setTownHall(number('townhall'));
            break;
          case 'building':
            controls.setBuildingLevel(values.kind as BuildingKind, number('level'));
            break;
          case 'research':
            controls.setResearch(group('troop', TROOP_KEYS), group('spell', SPELL_KEYS));
            break;
          case 'hero':
            controls.setKingLevel(number('kingLevel'));
            break;
          case 'heroes':
            controls.setHeroLevels(group('hero', HERO_KINDS as readonly HeroKind[]));
            break;
          case 'pets':
            controls.setPetLevels(group('pet', PET_KINDS as readonly PetKind[]));
            break;
          case 'item':
            controls.setItemLevel(values.slug, number('level'));
            break;
          case 'time':
            controls.advanceTime(Math.round(number('hours') * 3600));
            break;
          case 'damage':
            controls.damageBattle(number('percent'));
            break;
          case 'import':
            controls.importSave(values.save);
            break;
        }
      },
      'Applied.',
      event.submitter ?? document.activeElement,
    );
  });
  window.addEventListener(
    'keydown',
    (event) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (dialog.open) dialog.close();
        else open();
      } else if (dialog.open) event.stopImmediatePropagation();
    },
    true,
  );
  document.body.append(launcher, dialog);
}
