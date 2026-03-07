/* =========================================================
   OFFICE CHAT — Types
   Slack-style channels for Role↔Role ambient conversations
   ========================================================= */

export interface ChatMessage {
  id: string;
  ts: number;
  /** Who sent this message */
  roleId: string;
  /** Message text */
  text: string;
  /** Message type */
  type: 'chat' | 'dispatch';
  /** For social: the conversation partner */
  partnerId?: string;
  /** For dispatch: the target role */
  targetRoleId?: string;
}

export interface ChatChannel {
  id: string;          // 'office' | 'ch-xxx'
  name: string;        // '#office', '#engineering'
  members: string[];   // roleId[] — empty = all roles
  isDefault: boolean;  // #office = true, cannot delete
  messages: ChatMessage[];
}
