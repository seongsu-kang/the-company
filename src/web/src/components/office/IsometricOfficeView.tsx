import type { Role, Project, Wave, Standup, Decision } from '../../types/index';
import SpriteCanvas from './SpriteCanvas';
import FacilityCanvas from './FacilityCanvas';

/* ─── Isometric grid config ─────────────── */

const TILE_W = 200;
const TILE_H = 100;

/** Convert isometric grid (col, row) to screen (x, y) */
function isoToScreen(col: number, row: number): { x: number; y: number } {
  const x = (col - row) * (TILE_W / 2);
  const y = (col + row) * (TILE_H / 2);
  return { x, y };
}

/* ─── Role metadata ─────────────────────── */

const ROLE_COLORS: Record<string, string> = {
  cto: '#1565C0',
  cbo: '#E65100',
  pm: '#2E7D32',
  engineer: '#4A148C',
  designer: '#AD1457',
  qa: '#00695C',
};

const ROLE_ICONS: Record<string, string> = {
  cto: '\u{1F3D7}\u{FE0F}',
  cbo: '\u{1F4CA}',
  pm: '\u{1F4CB}',
  engineer: '\u2699\u{FE0F}',
  designer: '\u{1F3A8}',
  qa: '\u{1F50D}',
};

const DESK_ACTIVITY: Record<string, string> = {
  cto: '\uC544\uD0A4\uD14D\uCC98',
  cbo: '\uC2DC\uC7A5 \uBD84\uC11D',
  pm: 'PRD \uC791\uC131',
  engineer: '\uCF54\uB529',
  designer: '\uC2DC\uC548 \uC81C\uC791',
  qa: '\uD488\uC9C8 \uAC80\uC99D',
};

/* ─── Grid layout positions ─────────────── */

interface DeskConfig {
  roleId: string;
  col: number;
  row: number;
}

const DESK_LAYOUT: DeskConfig[] = [
  { roleId: 'cto',      col: 2, row: 0 },   // top center — leadership
  { roleId: 'cbo',      col: 4, row: 0 },   // top right — C-level peer
  { roleId: 'pm',       col: 0, row: 2 },   // left middle
  { roleId: 'engineer', col: 4, row: 2 },   // right middle
  { roleId: 'designer', col: 1, row: 3 },   // bottom left
  { roleId: 'qa',       col: 3, row: 3 },   // bottom right
];

interface FacilityConfig {
  id: string;
  col: number;
  row: number;
  type: 'meeting' | 'bulletin' | 'decision';
  label: string;
  icon: string;
  color: string;
}

const FACILITY_LAYOUT: FacilityConfig[] = [
  { id: 'meeting',   col: 2, row: 2, type: 'meeting',  label: 'MEETING ROOM',   icon: '\u{1F3E2}', color: '#3B82F6' },
  { id: 'bulletin',  col: 0, row: 0, type: 'bulletin', label: 'BULLETIN BOARD', icon: '\u{1F4CB}', color: '#64748b' },
  { id: 'decisions', col: 4, row: 4, type: 'decision', label: 'DECISION LOG',   icon: '\u{1F4DC}', color: '#64748b' },
];

/* ─── Floor grid tiles ──────────────────── */

/** Render checkerboard floor tiles covering the scene */
function FloorTiles() {
  const tiles: React.ReactNode[] = [];
  for (let col = -1; col <= 5; col++) {
    for (let row = -1; row <= 5; row++) {
      const { x, y } = isoToScreen(col, row);
      const isLight = (col + row) % 2 === 0;
      tiles.push(
        <div
          key={`floor-${col}-${row}`}
          className="iso-tile"
          style={{
            left: x,
            top: y,
            background: isLight ? 'var(--floor-light)' : 'var(--floor-dark)',
          }}
        />,
      );
    }
  }
  return <>{tiles}</>;
}

/* ─── Desk component ────────────────────── */

interface DeskProps {
  role: Role;
  col: number;
  row: number;
  speech: string;
  liveStatus?: string;
  activeTask?: string;
  onClick: () => void;
}

function IsoDeskTile({ role, col, row, speech, liveStatus, activeTask, onClick }: DeskProps) {
  const { x, y } = isoToScreen(col, row);
  const color = ROLE_COLORS[role.id] ?? '#666';
  const icon = ROLE_ICONS[role.id] ?? '';
  const isWorking = liveStatus === 'working';
  const activity = DESK_ACTIVITY[role.id] ?? '';

  const speechText = isWorking && activeTask
    ? activeTask.slice(0, 40)
    : speech
      ? speech.slice(0, 40)
      : activity;

  return (
    <div
      className={`iso-desk${isWorking ? ' iso-desk--working' : ''}`}
      style={{ left: x, top: y }}
      onClick={onClick}
      title={`${role.name} — click to open`}
    >
      {/* Diamond floor tile for desk */}
      <div className="iso-desk-floor" style={{ borderColor: color }} />

      {/* Desk surface block */}
      <div className="iso-desk-surface" style={{ background: 'var(--desk-wood)', borderColor: 'var(--desk-dark)' }}>
        {/* Monitor on desk */}
        <div className="iso-desk-monitor" />
      </div>

      {/* Sprite container — positioned above the desk */}
      <div className="iso-desk-sprite">
        <SpriteCanvas roleId={role.id} />
      </div>

      {/* Role name label */}
      <div className="iso-role-label" style={{ color }}>
        {icon} {role.id.toUpperCase()}
      </div>

      {/* Status dot */}
      <div
        className="iso-status-dot"
        style={{
          background: isWorking ? 'var(--idle-amber)' : 'var(--active-green)',
        }}
      />

      {/* Speech bubble */}
      {speechText && (
        <div className="iso-speech-bubble">
          {speechText}
        </div>
      )}
    </div>
  );
}

/* ─── Facility tile component ───────────── */

interface FacilityTileProps {
  facility: FacilityConfig;
  project?: Project;
  waves: Wave[];
  standups: Standup[];
  decisions: Decision[];
  onClick: () => void;
}

function IsoFacilityTile({ facility, project, waves, standups, decisions, onClick }: FacilityTileProps) {
  const { x, y } = isoToScreen(facility.col, facility.row);

  let subtitle = '';
  if (facility.id === 'meeting' && project) {
    subtitle = `"${project.name}"`;
  } else if (facility.id === 'bulletin') {
    if (waves[0]) subtitle = `Wave ${waves[0].id}`;
    else if (standups[0]) subtitle = `Standup ${standups[0].date}`;
  } else if (facility.id === 'decisions') {
    subtitle = `${decisions.length} decisions`;
  }

  return (
    <div
      className="iso-facility"
      style={{ left: x, top: y }}
      onClick={onClick}
      title={`${facility.label} — click to open`}
    >
      {/* Diamond floor tile */}
      <div className="iso-facility-floor" style={{ borderColor: facility.color }} />

      {/* Facility body */}
      <div className="iso-facility-body" style={{ borderColor: facility.color }}>
        <FacilityCanvas type={facility.type} />
      </div>

      {/* Label */}
      <div className="iso-facility-label" style={{ color: facility.color }}>
        {facility.icon} {facility.label}
      </div>

      {/* Sub-label */}
      {subtitle && (
        <div className="iso-facility-sublabel">{subtitle}</div>
      )}
    </div>
  );
}

/* ─── Props interface ───────────────────── */

interface IsometricOfficeViewProps {
  roles: Role[];
  projects: Project[];
  waves: Wave[];
  standups: Standup[];
  decisions: Decision[];
  roleStatuses: Record<string, string>;
  activeExecs: { roleId: string; task: string }[];
  onRoleClick: (roleId: string) => void;
  onProjectClick: (projectId: string) => void;
  onBulletinClick: () => void;
  onDecisionsClick: () => void;
  getRoleSpeech: (roleId: string) => string;
}

/* ─── Main component ────────────────────── */

export default function IsometricOfficeView({
  roles,
  projects,
  waves,
  standups,
  decisions,
  roleStatuses,
  activeExecs,
  onRoleClick,
  onProjectClick,
  onBulletinClick,
  onDecisionsClick,
  getRoleSpeech,
}: IsometricOfficeViewProps) {
  const mainProject = projects[0];

  /* Build a map for quick role lookup */
  const roleMap = new Map(roles.map((r) => [r.id, r]));

  /* Determine scene offset so it's centered */
  // Grid spans cols -1..4 and rows -1..4. The bounding box:
  // x range: isoToScreen(-1,4).x .. isoToScreen(4,-1).x
  // y range: isoToScreen(-1,-1).y .. isoToScreen(4,4).y
  // We'll use a fixed scene canvas size and center it.
  const SCENE_W = 1400;
  const SCENE_H = 900;
  // Center of grid (col=2, row=2)
  const centerIso = isoToScreen(2, 2);
  const offsetX = SCENE_W / 2 - centerIso.x;
  const offsetY = SCENE_H / 2 - centerIso.y - 40; // nudge up a bit

  return (
    <div className="iso-scene">
      {/* Scrollable scene canvas */}
      <div className="iso-canvas" style={{ width: SCENE_W, height: SCENE_H }}>
        {/* Inner scene — everything positioned relative to this with iso offsets */}
        <div
          className="iso-inner"
          style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}
        >
          {/* Floor tiles */}
          <FloorTiles />

          {/* Role desks */}
          {DESK_LAYOUT.map((desk) => {
            const role = roleMap.get(desk.roleId);
            if (!role) return null;
            return (
              <IsoDeskTile
                key={desk.roleId}
                role={role}
                col={desk.col}
                row={desk.row}
                speech={getRoleSpeech(desk.roleId)}
                liveStatus={roleStatuses[desk.roleId]}
                activeTask={activeExecs.find((e) => e.roleId === desk.roleId)?.task}
                onClick={() => onRoleClick(desk.roleId)}
              />
            );
          })}

          {/* Facility tiles */}
          {FACILITY_LAYOUT.map((facility) => (
            <IsoFacilityTile
              key={facility.id}
              facility={facility}
              project={mainProject}
              waves={waves}
              standups={standups}
              decisions={decisions}
              onClick={
                facility.id === 'meeting'
                  ? () => mainProject && onProjectClick(mainProject.id)
                  : facility.id === 'bulletin'
                    ? onBulletinClick
                    : onDecisionsClick
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
