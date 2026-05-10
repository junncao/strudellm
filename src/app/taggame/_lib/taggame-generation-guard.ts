let activeTagGameRequestId: string | null = null;

export function setActiveTagGameRequestId(requestId: string | null) {
  activeTagGameRequestId = requestId;
}

export function getActiveTagGameRequestId() {
  return activeTagGameRequestId;
}
