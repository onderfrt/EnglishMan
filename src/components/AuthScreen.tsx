import { useState, type FormEvent } from 'react';
import { useBack } from '../lib/back';
import { sendPasswordReset, signIn, signUp, updatePassword, useSync } from '../lib/sync/engine';
import { BackBar } from './BackBar';

type Mode = 'signin' | 'signup' | 'reset' | 'new-password';

interface Props {
  onClose: () => void;
  initialMode?: Mode;
}

/** Giriş, hesap oluşturma, şifre sıfırlama ve (sıfırlama bağlantısından gelince) yeni şifre belirleme. */
export function AuthScreen({ onClose, initialMode = 'signin' }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const { user } = useSync();

  useBack(true, onClose);

  const run = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (mode !== 'new-password' && !/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Geçerli bir e-posta adresi yaz.');
    if ((mode === 'signup' || mode === 'new-password') && password.length < 6) return setError('Şifre en az 6 karakter olmalı.');
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        onClose();
      } else if (mode === 'signup') {
        const { needsConfirmation } = await signUp(email, password);
        if (needsConfirmation) {
          setInfo(`📧 ${email.trim()} adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra buradan giriş yapabilirsin.`);
          setMode('signin');
        } else onClose();
      } else if (mode === 'reset') {
        await sendPasswordReset(email);
        setInfo('📧 Şifre sıfırlama bağlantısı gönderildi. E-postandaki bağlantıya tıklayınca yeni şifreni belirleyebilirsin.');
      } else {
        await updatePassword(password);
        setInfo('✅ Şifren değiştirildi.');
        setTimeout(onClose, 1200);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const heads: Record<Mode, [string, string]> = {
    signin: ['Tekrar hoş geldin', 'Kaldığın yerden devam et. Kelimelerin ve ilerlemen hesabında seni bekliyor.'],
    signup: ['Hesap oluştur', 'Kelimelerin, ilerlemen ve fotoğrafların telefonunda ve bilgisayarında aynı olsun.'],
    reset: ['Şifremi unuttum', 'E-posta adresini yaz, şifreni sıfırlaman için bir bağlantı gönderelim.'],
    'new-password': ['Yeni şifre', `${user?.email ?? 'Hesabın'} için yeni bir şifre belirle.`],
  };

  return (
    <div className="viewer auth-screen">
      <BackBar title="" />
      <div className="auth-body">
        <p className="brand">
          <span className="brand-mark">E</span>
          EnglishMan
        </p>
        <h1 className="auth-title">{heads[mode][0]}</h1>
        <p className="muted auth-lead">{heads[mode][1]}</p>

        {(mode === 'signin' || mode === 'signup') && (
          <div className="segmented" role="tablist">
            <button role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>
              Giriş yap
            </button>
            <button role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
              Kayıt ol
            </button>
          </div>
        )}

        <form onSubmit={run} noValidate>
          {mode !== 'new-password' && (
            <label className="field">
              <span>E-posta</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                autoCapitalize="off"
                placeholder="ornek@mail.com"
              />
            </label>
          )}
          {mode !== 'reset' && (
            <label className="field">
              <span>{mode === 'new-password' ? 'Yeni şifre' : 'Şifre'}</span>
              <div className="password-row">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  placeholder={mode === 'signin' ? '' : 'En az 6 karakter'}
                />
                <button type="button" className="link-btn" onClick={() => setShow(!show)}>
                  {show ? 'Gizle' : 'Göster'}
                </button>
              </div>
            </label>
          )}
          {mode === 'signin' && (
            <button type="button" className="link-btn forgot-link" onClick={() => setMode('reset')}>
              Şifremi unuttum
            </button>
          )}
          {error && <p className="small error">{error}</p>}
          {info && <p className="small notice">{info}</p>}
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={busy}>
            {busy ? 'Lütfen bekle…' : { signin: 'Giriş yap', signup: 'Hesap oluştur', reset: 'Sıfırlama bağlantısı gönder', 'new-password': 'Şifreyi kaydet' }[mode]}
          </button>
        </form>

        {mode === 'reset' && (
          <button className="link-btn center-link" onClick={() => setMode('signin')}>
            ← Girişe dön
          </button>
        )}
        {mode === 'signup' && (
          <p className="muted small auth-foot">
            Hesap oluşturunca bu cihazdaki ilerlemen ve kendi kelimelerin hesabına taşınır. E-posta adresin yalnızca giriş ve
            şifre sıfırlama için kullanılır.
          </p>
        )}
      </div>
    </div>
  );
}
