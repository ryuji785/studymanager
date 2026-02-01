export type GoogleCredentialResponse = {
  credential?: string;
};

export type GoogleProfile = {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
};

const GOOGLE_SCRIPT_ID = 'google-identity-service';
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              text?: string;
              width?: number;
              shape?: string;
            },
          ) => void;
        };
      };
    };
  }
}

export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('window is not available'));

  const existing = document.getElementById(GOOGLE_SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      if ((existing as HTMLScriptElement).dataset.loaded === 'true') resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Google Identity script failed to load')));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    });
    script.addEventListener('error', () => reject(new Error('Google Identity script failed to load')));
    document.head.appendChild(script);
  });
}

export function parseGoogleCredential(credential: string): GoogleProfile | null {
  try {
    const [, payload] = credential.split('.');
    if (!payload) return null;
    const decoded = JSON.parse(decodeBase64Url(payload));
    return decoded as GoogleProfile;
  } catch (error) {
    console.warn('Failed to parse Google credential.', error);
    return null;
  }
}

function decodeBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = padded.length % 4 ? 4 - (padded.length % 4) : 0;
  const normalized = padded + '='.repeat(padLength);
  return atob(normalized);
}
