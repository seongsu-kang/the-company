# Web E2E Sanity Tests

> Core Office + Terminal/Chat + Wave + Save sanity test cases

---

## Prerequisites

- API server running on `:3001`
- Vite dev server running (`npx vite`)
- At least 1 C-Level role (CTO) and 2+ sub-roles (PM, Engineer) in org

---

## TC-T: Terminal & Chat System

### TC-T01: Terminal Open/Close

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "TERMINAL" button | Terminal panel opens from right |
| 2 | Check tab bar | #office tab visible with chat icon |
| 3 | Click "TERMINAL" again | Terminal closes |

### TC-T02: #office Channel — Dispatch Only

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open Terminal, click #office | Channel view shows "#office" header with "system logs" label |
| 2 | Wait 30+ seconds (ambient speech running) | No monologue/personality messages appear in #office |
| 3 | Dispatch a task (Assign to CTO) | Dispatch event appears with arrow icon (→) |
| 4 | When job completes | Completion event appears with checkmark icon |
| 5 | Check message format | `[CEO → RoleName] Assign: task` format |

### TC-T03: Create Custom Channel

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "+" button in terminal tab bar | Menu shows "New Channel" option |
| 2 | Click "New Channel" | Input field appears with # prefix |
| 3 | Type "engineering", press Enter | New #engineering tab appears, auto-selected |
| 4 | Check channel view | Shows "#engineering" header, "no members" label |
| 5 | Shows empty state | "No messages yet — invite roles to start chatting" |

### TC-T04: Channel Member Management

| Step | Action | Expected |
|------|--------|----------|
| 1 | On custom channel, find Invite button | "Invite" button visible in channel header |
| 2 | Click "Invite" | Role toggle buttons appear (CTO, PM, Engineer, etc.) |
| 3 | Click "CTO" | CTO toggled on (checkmark), header shows "CTO" in members |
| 4 | Click "Engineer" | Engineer added, header shows "CTO, Engineer" |
| 5 | Click "Done" | Invite panel closes, members persisted |
| 6 | Reload page | Channel and members restored from localStorage |

### TC-T05: Delete Custom Channel

| Step | Action | Expected |
|------|--------|----------|
| 1 | Hover custom channel tab | × close button appears |
| 2 | Click × | Channel deleted |
| 3 | #office cannot be deleted | No × button on #office tab |

### TC-T06: Unread Indicator

| Step | Action | Expected |
|------|--------|----------|
| 1 | Create channel with members, switch to #office | Viewing #office |
| 2 | Wait for chat message in member channel | Green dot appears on channel tab |
| 3 | Click the channel tab | Green dot disappears (unread cleared) |

### TC-T07: Channel Persistence (localStorage)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Create channel, add members | Channel visible |
| 2 | Reload page | Channel, members, and messages preserved |
| 3 | #office messages | Only dispatch-type messages survive reload (old monologues filtered) |

### TC-T08: Terminal Resize

| Step | Action | Expected |
|------|--------|----------|
| 1 | Drag left edge of terminal panel | Panel width changes |
| 2 | Width stays between 400-800px | Clamped to bounds |

---

## TC-O: Office Core

### TC-O01: Page Load

| Step | Action | Expected |
|------|--------|----------|
| 1 | Navigate to / | Loading spinner briefly, then office view |
| 2 | Check top bar | Company name, budget, roles count, projects count |
| 3 | Check LEADERSHIP section | C-Level role cards |
| 4 | Check TEAM section | Sub-role cards + "HIRE NEW ROLE" card |
| 5 | Check OFFICE section | Meeting Room, Bulletin, Decisions, Knowledge |
| 6 | Check bottom bar | CARD/ISO toggle, theme, CEO WAVE, TERMINAL |

### TC-O02: Role Side Panel

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click any role card | Side panel slides in from right |
| 2 | Check header | Role icon, name (editable), level, status, reports-to |
| 3 | Check sections | Profile, Authority, Relationships, Fire Role |
| 4 | Click X | Side panel closes |

### TC-O03: View Toggle

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "ISO" button | Switches to isometric office view |
| 2 | Check desks | Role desks with sprites, monitors, labels |
| 3 | Check speech bubbles | Ambient speech appears above idle roles |
| 4 | Click "CARD" button | Switches back to card view |

### TC-O04: Ambient Speech (Template Pipeline)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Switch to ISO view | Office view with role desks |
| 2 | Wait ~18 seconds | Speech bubble appears on idle role |
| 3 | Check bubble content | Korean personality/work speech (template) |
| 4 | Wait 6 seconds | Bubble auto-clears |
| 5 | Sometimes 2 roles converse | Social conversation (alternating turns) |

### TC-O05: Relationships Panel

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click role card to open side panel | Side panel with role info |
| 2 | Find "Relationships" section | Expandable section with relationship count |
| 3 | Expand relationships | Shows familiarity bars for known roles |
| 4 | Colors by level | Green (Best Partner >=80), Blue (Friend >=50), Orange (Colleague >=20), Grey |

---

## TC-W: Wave Command Center

### TC-W01: WaveModal - Propagation Preview

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "CEO WAVE" button in bottom bar | WaveModal opens with backdrop |
| 2 | Check "Propagation Preview" section | Org tree shows CEO -> C-Level (direct) -> sub-roles (via re-dispatch) |
| 3 | Check role count | "N roles will receive this wave" matches total org size minus CEO |
| 4 | Leave directive empty | "Dispatch to N Role" button is disabled |
| 5 | Type directive, click Cancel | Modal closes, no wave dispatched |
| 6 | Press Escape | Modal closes |

### TC-W02: Wave Dispatch -> Command Center Opens

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open WaveModal, type directive | Directive textarea populated |
| 2 | Click "Dispatch to N Role" (or Cmd+Enter) | Modal closes |
| 3 | Check screen | WaveCommandCenter opens (960px, centered, z-61) |
| 4 | Check header | "WAVE COMMAND CENTER" + elapsed timer + "0/N done" badge |
| 5 | Check directive | Directive text shown below header in italic |

### TC-W03: Org Tree - Real-time Node Status

| Step | Action | Expected |
|------|--------|----------|
| 1 | After dispatch, check left panel | CEO node: dimmed, dashed border |
| 2 | Check C-Level nodes | Status "Working...", role-color border, pulsing dot |
| 3 | Check sub-role nodes (before dispatch) | Status "Waiting", grey border, grey dot |
| 4 | Wait for C-Level to dispatch to sub-roles | Sub-role nodes transition to "Working..." with color border |
| 5 | Wait for job completion | Completed nodes show green border + checkmark |

### TC-W05: Minimize / Restore

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click minimize button (--) | Command Center disappears, office view visible |
| 2 | Check bottom bar | Red "WAVE" button appears (pulsing) |
| 3 | Click "WAVE" button | Command Center restores with all events preserved |
| 4 | Check timer | Elapsed time continued (not reset) |

### TC-W06: Wave Complete State

| Step | Action | Expected |
|------|--------|----------|
| 1 | Wait for all jobs to finish | Header changes to "WAVE COMPLETE" |
| 2 | Check progress badge | "N/N done" |
| 3 | Check close button | X button / "Close" button appears |
| 4 | Click Close | Command Center closes |

### TC-W08: Non-Wave Job (Regression)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click a role card, click "Assign" or "Ask" | AssignTaskModal opens |
| 2 | Submit task | ActivityPanel opens (NOT WaveCommandCenter) |
| 3 | Check ActivityPanel | Standard modal layout (720px, single job view) |

---

## TC-S: Save System

### TC-S01: HUD Save Indicator

| Step | Action | Expected |
|------|--------|----------|
| 1 | Load office page | Save indicator visible in top bar (dot + date) |
| 2 | Check dot color | Green dot (synced) or yellow dot (dirty) |
| 3 | Click save indicator | SaveModal opens |

### TC-S02: SaveModal - Save Tab

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open SaveModal (click HUD save button) | Modal opens with "SAVE GAME" header |
| 2 | Check tabs | "SAVE" and "HISTORY" tabs visible |
| 3 | Check status | Shows unsaved count or "All changes saved" |
| 4 | Press Escape | Modal closes |

### TC-S03: SaveModal - History Tab

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open SaveModal, click "HISTORY" tab | History tab activates |
| 2 | Check commit list | Shows shortSha, message, time ago |

### TC-S05: Keyboard Shortcut (Cmd+S)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Press Cmd+S (or Ctrl+S) with dirty files | SaveModal opens |

### TC-S06: Preferences Persistence

| Step | Action | Expected |
|------|--------|----------|
| 1 | GET /api/preferences | Returns { appearances, theme } |
| 2 | PATCH /api/preferences { theme: 'cyberpunk' } | Theme updated |
| 3 | Restore original theme | OK |

---

## Run

```bash
# All tests
npx playwright test tests/e2e/

# Terminal/Chat only
npx playwright test tests/e2e/terminal.spec.ts

# Wave only
npx playwright test tests/e2e/wave.spec.ts

# Save only
npx playwright test tests/e2e/save.spec.ts
```

---

*Last updated: 2026-03-07*
