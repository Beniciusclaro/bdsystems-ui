export async function getApiErrorMessage(
  response: Response,
  fallback: string,
  statusMessages: Partial<Record<number, string>> = {},
): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string' &&
      body.message.trim()
    ) {
      return body.message;
    }
  } catch {
    return statusMessages[response.status] ?? fallback;
  }

  return statusMessages[response.status] ?? fallback;
}
