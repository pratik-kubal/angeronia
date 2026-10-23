"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  CalendarStarIcon,
  CaretDownIcon,
  CaretRightIcon,
  CheckIcon,
  CircleHalfIcon,
  GearSixIcon,
  LockSimpleIcon,
  PaletteIcon,
  PlusIcon,
  QuestionIcon,
  SpeakerHighIcon,
  TrophyIcon,
  VibrateIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DIFFICULTY_COPY, HOW_TO_PLAY, RARITY_COPY, RESULT_COPY, SETTINGS_COPY, THEME_COPY } from "@/data/sudoku";
import { TROPHIES, type Trophy } from "@/data/sudoku-trophies";
import { HINTS, type GameState } from "@/lib/sudoku/game";
import { DIFFICULTIES, type Difficulty } from "@/lib/sudoku/generate";
import {
  THEMES,
  THEME_LIST,
  formatSeason,
  inSeason,
  seasonalTheme,
  type SecretDef,
  type ThemeChoice,
  type ThemeDef,
  type ThemeId,
} from "@/lib/sudoku/themes";
import { RARITIES, foundCount, trophyById, type Collection } from "@/lib/sudoku/trophies";
import { APPEARANCES, type Appearance, type Best, type Found, type Settings } from "./storage";

export const formatTime = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return s >= 3600 ? `${Math.floor(s / 3600)}:${mm}:${ss}` : `${mm}:${ss}`;
};

/** The pad's clock, short enough for its square (34px on a 320px phone): "04:12", from an hour up "1h05", from ten "12h". */
export const formatClock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  if (h >= 10) return `${h}h`;
  return h ? `${h}h${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}` : formatTime(ms);
};

const APPEARANCE_LABELS: Record<Appearance, string> = { system: "System", light: "Light", dark: "Dark" };
/** Signal bars lit per difficulty. */
const BARS: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };

/** A difficulty's chip: its name on its own hue, led by a small gem. */
function DifficultyChip({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className="sdk-chip" data-difficulty={difficulty}>
      {DIFFICULTY_COPY[difficulty].name}
    </span>
  );
}

function Tile({ children, difficulty }: { children: ReactNode; difficulty?: Difficulty }) {
  return (
    <span className="sdk-tile" data-difficulty={difficulty} aria-hidden>
      {children}
    </span>
  );
}

function Switch({ label, icon, checked, onChange }: { label: string; icon: ReactNode; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <label className="sdk-row">
      <Tile>{icon}</Tile>
      <span className="sdk-row-text">{label}</span>
      <input type="checkbox" role="switch" className="sdk-switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

/** Play's sheet: a difficulty for a new game, how to play and, before the first game, Settings. */
export function NewGamePanel({
  best,
  current,
  onStart,
  onSettings,
}: {
  best: Best;
  /** The difficulty of the game under way, if any (starting another ends it). */
  current: Difficulty | null;
  onStart: (difficulty: Difficulty) => void;
  /** Opens Settings over the sheet, or null for no Settings row (only the first game's sheet, which can't close, has one). */
  onSettings: (() => void) | null;
}) {
  return (
    <>
      <h2 className="sdk-sheet-title">New game</h2>
      <div className="sdk-group">
        {DIFFICULTIES.map((d) => (
          <button key={d} type="button" className="sdk-row sdk-level" onClick={() => onStart(d)}>
            <Tile difficulty={d}>
              <span className="sdk-bars">
                {[1, 2, 3].map((k) => (
                  <i key={k} data-on={k <= BARS[d] ? "" : undefined} />
                ))}
              </span>
            </Tile>
            <span className="sdk-row-text">
              <strong>
                {DIFFICULTY_COPY[d].name}
                {current === d && <span className="sdk-current">Current</span>}
              </strong>
              <span>{DIFFICULTY_COPY[d].blurb}</span>
            </span>
            {best[d] !== undefined && (
              <span className="sdk-best">
                Best <b>{formatTime(best[d]!)}</b>
              </span>
            )}
          </button>
        ))}
      </div>
      {current && <p className="sdk-note">A new game ends the one under way.</p>}
      <details className="sdk-group sdk-rules">
        <summary className="sdk-row">
          <Tile>
            <QuestionIcon size={17} weight="bold" />
          </Tile>
          <span className="sdk-row-text">How to play</span>
          <CaretDownIcon className="sdk-chevron" size={16} weight="bold" aria-hidden />
        </summary>
        <ul>
          {HOW_TO_PLAY.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </details>
      {onSettings && (
        <div className="sdk-group">
          <button type="button" className="sdk-row" onClick={onSettings}>
            <Tile>
              <GearSixIcon size={17} weight="bold" />
            </Tile>
            <span className="sdk-row-text">Settings</span>
            <CaretRightIcon className="sdk-chevron" size={16} weight="bold" aria-hidden />
          </button>
        </div>
      )}
    </>
  );
}

/** The gear's sheet: the theme, sound, haptics and appearance. */
export function SettingsPanel({
  settings,
  theme,
  onSettings,
  onThemes,
}: {
  settings: Settings;
  /** The theme on screen (null until the settings have loaded). */
  theme: ThemeId | null;
  onSettings: (settings: Settings) => void;
  onThemes: () => void;
}) {
  const shown = theme ? THEMES[theme] : null;
  return (
    <>
      <h2 className="sdk-sheet-title">Settings</h2>
      <div className="sdk-group">
        <button type="button" className="sdk-row" onClick={onThemes}>
          <Tile>
            <PaletteIcon size={17} weight="fill" />
          </Tile>
          <span className="sdk-row-text">{THEME_COPY.row}</span>
          {shown && (
            <span className="sdk-best">
              <b>
                {shown.emoji} {settings.theme === "seasonal" ? THEME_COPY.seasonal : shown.name}
              </b>
            </span>
          )}
          <CaretRightIcon className="sdk-chevron" size={16} weight="bold" aria-hidden />
        </button>
        <Switch
          label="Sound"
          icon={<SpeakerHighIcon size={17} weight="bold" />}
          checked={settings.sound}
          onChange={(sound) => onSettings({ ...settings, sound })}
        />
        <Switch
          label="Haptics"
          icon={<VibrateIcon size={17} weight="bold" />}
          checked={settings.haptics}
          onChange={(haptics) => onSettings({ ...settings, haptics })}
        />
        <div className="sdk-row" role="radiogroup" aria-labelledby="sdk-appearance">
          <Tile>
            <CircleHalfIcon size={17} weight="fill" />
          </Tile>
          <span id="sdk-appearance" className="sdk-row-text">
            Appearance
          </span>
          <span className="sdk-segments">
            {APPEARANCES.map((a) => (
              <label key={a}>
                <input
                  type="radio"
                  name="sdk-appearance"
                  value={a}
                  checked={settings.appearance === a}
                  onChange={() => onSettings({ ...settings, appearance: a })}
                />
                <span>{APPEARANCE_LABELS[a]}</span>
              </label>
            ))}
          </span>
        </div>
      </div>
      <p className="sdk-note">{SETTINGS_COPY.silentNote}</p>
    </>
  );
}

/** A trophy: its emoji large, its name, rarity (and how many the player has) and its line. */
export function TrophyCard({ trophy, count, kicker }: { trophy: Trophy; count: number; kicker: string | null }) {
  return (
    <div className="sdk-trophy" data-rarity={trophy.rarity}>
      <span className="sdk-trophy-emoji" aria-hidden>
        {trophy.emoji}
      </span>
      <span className="sdk-trophy-text">
        {kicker && <span className="sdk-trophy-kicker">{kicker}</span>}
        <strong>{trophy.name}</strong>
        <span className="sdk-rarity" data-rarity={trophy.rarity}>
          {RARITY_COPY[trophy.rarity]}
          {count > 1 ? ` · ×${count}` : ""}
        </span>
        <span className="sdk-trophy-blurb">{trophy.blurb}</span>
      </span>
    </div>
  );
}

/** The collection: every trophy on shelves by rarity, rarest first; one not found yet is a "?". */
export function CollectionPanel({ collection, highlight }: { collection: Collection; highlight: string | null }) {
  const [picked, setPicked] = useState<string | null>(highlight);
  const found = foundCount(collection);
  const shown = picked ? trophyById(picked) : undefined;
  return (
    <>
      <h2 className="sdk-sheet-title">Collection</h2>
      <p className="sdk-collection-count">
        <b>{found}</b> of {TROPHIES.length} found
      </p>
      <div className="sdk-progress" role="progressbar" aria-label="Trophies found" aria-valuemin={0} aria-valuemax={TROPHIES.length} aria-valuenow={found}>
        <span style={{ width: `${(found / TROPHIES.length) * 100}%` }} />
      </div>
      {/* Sticky, so a trophy tapped far down the shelves shows here; read out as it changes. */}
      <div className="sdk-detail" aria-live="polite">
        {shown && collection[shown.id] ? (
          <TrophyCard trophy={shown} count={collection[shown.id]} kicker={null} />
        ) : (
          <p className="sdk-note">{found ? "Tap a trophy to look closer." : "Solve a board to win your first trophy."}</p>
        )}
      </div>
      {RARITIES.map((rarity) => {
        const shelf = TROPHIES.filter((t) => t.rarity === rarity);
        return (
          <section key={rarity} className="sdk-shelf" data-rarity={rarity}>
            <h3 className="sdk-label">
              {RARITY_COPY[rarity]}
              <span>
                {shelf.filter((t) => collection[t.id]).length}/{shelf.length}
              </span>
            </h3>
            <div className="sdk-shelf-grid">
              {shelf.map((t) =>
                collection[t.id] ? (
                  <button
                    key={t.id}
                    type="button"
                    className="sdk-slot"
                    data-rarity={rarity}
                    aria-pressed={picked === t.id}
                    aria-label={`${t.name}${collection[t.id] > 1 ? `, ×${collection[t.id]}` : ""}`}
                    onClick={() => setPicked(t.id)}
                  >
                    <span aria-hidden>{t.emoji}</span>
                    {collection[t.id] > 1 && <b aria-hidden>{collection[t.id]}</b>}
                  </button>
                ) : (
                  <span key={t.id} className="sdk-slot" data-locked data-rarity={rarity} aria-hidden>
                    ?
                  </span>
                ),
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}

/** A solved board: the trophy it won, any secrets found on the way, the time, the record, and the way on. */
export function ResultPanel({
  state,
  best,
  newBest,
  collection,
  solved,
  secrets,
  onAgain,
  onMenu,
  onCollection,
}: {
  state: GameState;
  best: Best;
  newBest: boolean;
  collection: Collection;
  /** The heading: the theme's word for a solved board. */
  solved: string;
  /** The secrets first found during this game. */
  secrets: readonly SecretDef[];
  onAgain: () => void;
  onMenu: () => void;
  onCollection: () => void;
}) {
  const record = best[state.difficulty];
  const trophy = state.trophy ? trophyById(state.trophy) : undefined;
  const count = trophy ? (collection[trophy.id] ?? 1) : 0;
  return (
    <div className="sdk-result">
      <div className="sdk-result-head">
        <h2 className="sdk-result-title">{solved}</h2>
        <DifficultyChip difficulty={state.difficulty} />
      </div>
      {trophy && <TrophyCard trophy={trophy} count={count} kicker={count > 1 ? RESULT_COPY.again : RESULT_COPY.newFind} />}
      <div className="sdk-result-side">
        {secrets.map((secret) => (
          <p key={secret.id} className="sdk-found">
            <span aria-hidden>{secret.emoji}</span>
            <span>
              <small>{THEME_COPY.secretFound}</small>
              <b>{secret.name}</b>
            </span>
          </p>
        ))}
        <dl className="sdk-stats">
          <div>
            <dt>Time</dt>
            <dd className="sdk-final">{formatTime(state.elapsed)}</dd>
          </div>
          <div>
            <dt>Hints used</dt>
            <dd>{HINTS - state.hintsLeft}</dd>
          </div>
          <div data-new={newBest ? "" : undefined}>
            <dt>{newBest ? "New best" : "Best time"}</dt>
            <dd>{record !== undefined ? formatTime(record) : "—"}</dd>
          </div>
        </dl>
        <div className="sdk-actions">
          <button type="button" className="sdk-btn sdk-btn-primary" onClick={onAgain}>
            <PlusIcon size={18} weight="bold" aria-hidden />
            {RESULT_COPY.next}
          </button>
          <div className="sdk-actions-row">
            <button type="button" className="sdk-btn" onClick={onCollection}>
              <TrophyIcon size={18} weight="fill" aria-hidden />
              Collection
            </button>
            <button type="button" className="sdk-btn" onClick={onMenu}>
              Change difficulty
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A theme's swatch: its three colours for the scheme, under its emoji. */
function Swatch({ theme, scheme }: { theme: ThemeDef; scheme: "light" | "dark" }) {
  const [s1, s2, s3] = theme.swatch[scheme];
  return (
    <span className="sdk-swatch" style={{ "--s1": s1, "--s2": s2, "--s3": s3 } as CSSProperties} aria-hidden>
      {theme.emoji}
    </span>
  );
}

/** The id of a picker row's details (its blurb, season and secrets), which describe its radio. */
const detailsId = (value: ThemeChoice) => `sdk-theme-${value}-details`;

function ThemeOption({
  value,
  label,
  checked,
  onChoose,
  children,
}: {
  value: ThemeChoice;
  label: string;
  checked: boolean;
  onChoose: (choice: ThemeChoice) => void;
  children: ReactNode;
}) {
  return (
    <label className="sdk-row sdk-pick">
      <input
        type="radio"
        name="sdk-theme"
        value={value}
        aria-label={label}
        aria-describedby={detailsId(value)}
        checked={checked}
        onChange={() => onChoose(value)}
      />
      {children}
      <span className="sdk-pick-check" aria-hidden>
        <CheckIcon size={13} weight="bold" />
      </span>
    </label>
  );
}

/**
 * The theme picker: Seasonal (the calendar's theme) or any theme at all, each with its season and
 * how many of its secrets are found; then the secrets of the theme on screen, a riddle for each
 * one still hidden. A choice applies at once, behind the sheet.
 */
export function ThemePanel({
  choice,
  active,
  scheme,
  secrets,
  onChoose,
}: {
  choice: ThemeChoice;
  /** The theme on screen. */
  active: ThemeId;
  scheme: "light" | "dark";
  secrets: Found;
  onChoose: (choice: ThemeChoice) => void;
}) {
  const today = new Date();
  const seasonal = THEMES[seasonalTheme(today)];
  const shown = THEMES[active];
  const foundIn = (theme: ThemeDef) => theme.secrets.filter((s) => secrets[theme.id]?.includes(s.id));
  const shownFound = foundIn(shown);
  return (
    <>
      <h2 className="sdk-sheet-title">{THEME_COPY.title}</h2>
      {/* One radio group (one name) drawn as two cards: Seasonal, then the themes. */}
      <div role="radiogroup" aria-label={THEME_COPY.title}>
        <div className="sdk-group">
          <ThemeOption value="seasonal" label={THEME_COPY.seasonal} checked={choice === "seasonal"} onChoose={onChoose}>
            <Tile>
              <CalendarStarIcon size={17} weight="fill" />
            </Tile>
            <span className="sdk-row-text">
              <strong>{THEME_COPY.seasonal}</strong>
              <span id={detailsId("seasonal")}>
                {THEME_COPY.seasonalBlurb} {THEME_COPY.now}: {seasonal.emoji} {seasonal.name}
              </span>
            </span>
          </ThemeOption>
        </div>
        <div className="sdk-group">
          {THEME_LIST.map((theme) => (
            <ThemeOption key={theme.id} value={theme.id} label={theme.name} checked={choice === theme.id} onChoose={onChoose}>
              <Swatch theme={theme} scheme={scheme} />
              <span className="sdk-row-text">
                <strong>
                  {theme.name}
                  {theme.season && inSeason(theme.season, today) && <span className="sdk-season">{THEME_COPY.inSeason}</span>}
                </strong>
                {/* The radio's description: contents, so the two lines lay out as before. */}
                <span id={detailsId(theme.id)} className="sdk-pick-details">
                  <span>{theme.blurb}</span>
                  <span>
                    {/* The badge by the name, for screen readers. */}
                    {theme.season && inSeason(theme.season, today) && <span className="sdk-sr">{THEME_COPY.inSeason}. </span>}
                    {formatSeason(theme.season)} · {foundIn(theme).length}/{theme.secrets.length} {THEME_COPY.secrets.toLowerCase()}
                  </span>
                </span>
              </span>
            </ThemeOption>
          ))}
        </div>
      </div>
      <h3 className="sdk-label">
        {THEME_COPY.secrets} · {shown.name}
        <span className="sdk-tally">
          {shownFound.length}/{shown.secrets.length}
        </span>
      </h3>
      <div className="sdk-group">
        {shown.secrets.map((secret) =>
          shownFound.includes(secret) ? (
            <div key={secret.id} className="sdk-row sdk-secret">
              <Tile>{secret.emoji}</Tile>
              <span className="sdk-row-text">
                <strong>{secret.name}</strong>
                <span>{secret.found}</span>
              </span>
            </div>
          ) : (
            // data-locked, not data-hidden: Carbon's stylesheet hides every [data-hidden] on the page.
            <div key={secret.id} className="sdk-row sdk-secret" data-locked="">
              <Tile>
                <LockSimpleIcon size={16} weight="fill" />
              </Tile>
              <span className="sdk-row-text">
                <strong>{THEME_COPY.hidden}</strong>
                <span>{secret.riddle}</span>
              </span>
            </div>
          ),
        )}
      </div>
      <p className="sdk-note">{THEME_COPY.secretsNote}</p>
    </>
  );
}
