import { PermissionStatus } from "./Permissions"

type AuthenticatedMessage = {
    type: "authenticated",
    username: string,
    permissions: PermissionStatus
};

export type ServerToClientMessage =
    | AuthenticatedMessage;

// The code we close WebSocket connections with when authentication fails
export const AUTHENTICATION_FAILED_CODE = 3000; // https://github.com/Luka967/websocket-close-codes