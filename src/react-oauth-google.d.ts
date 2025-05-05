declare module '@react-oauth/google' {
  import React from 'react';

  export interface CredentialResponse {
    credential?: string;
    select_by?: string;
  }

  export interface GoogleLoginProps {
    onSuccess: (credentialResponse: CredentialResponse) => void;
    onError?: () => void;
    useOneTap?: boolean;
    type?: 'standard' | 'icon';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    logo_alignment?: 'left' | 'center';
    width?: string;
    locale?: string;
  }

  export const GoogleLogin: React.FC<GoogleLoginProps>;
  
  export interface GoogleOAuthProviderProps {
    clientId: string;
    children: React.ReactNode;
  }
  
  export const GoogleOAuthProvider: React.FC<GoogleOAuthProviderProps>;
}