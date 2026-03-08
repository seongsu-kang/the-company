export interface Message {
    id: string;
    from: 'ceo' | 'role';
    content: string;
    type: 'conversation' | 'directive' | 'system';
    status?: 'streaming' | 'done' | 'error';
    timestamp: string;
}
export interface Session {
    id: string;
    roleId: string;
    title: string;
    mode: 'talk' | 'do';
    messages: Message[];
    status: 'active' | 'closed';
    createdAt: string;
    updatedAt: string;
}
export declare function createSession(roleId: string, mode?: 'talk' | 'do'): Session;
export declare function getSession(id: string): Session | undefined;
export declare function listSessions(): Omit<Session, 'messages'>[];
export declare function addMessage(sessionId: string, msg: Message, streaming?: boolean): Session | undefined;
export declare function updateMessage(sessionId: string, messageId: string, updates: Partial<Pick<Message, 'content' | 'status'>>): Session | undefined;
export declare function updateSession(id: string, updates: Partial<Pick<Session, 'title' | 'mode'>>): Session | undefined;
export declare function deleteSession(id: string): boolean;
export declare function deleteMany(ids: string[]): number;
export declare function deleteEmpty(): {
    deleted: number;
    ids: string[];
};
