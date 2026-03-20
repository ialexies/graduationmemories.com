interface AccessDeniedPageProps {
  reason: 'token_required' | 'invalid' | 'disabled' | 'not_found' | 'network';
}

const messages: Record<AccessDeniedPageProps['reason'], string> = {
  token_required: 'This page requires a valid link. Please use the link from your NFC card.',
  invalid: 'Access denied. This link may be invalid or expired.',
  disabled: 'This page is temporarily unavailable.',
  not_found: 'Page not found.',
  network: 'Unable to load. Please check your connection and try again.',
};

export function AccessDeniedPage({ reason }: AccessDeniedPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {reason === 'not_found' ? 'Page not found' : 'Access denied'}
        </h1>
        <p className="text-slate-500">{messages[reason]}</p>
      </div>
    </div>
  );
}
