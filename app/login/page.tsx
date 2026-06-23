// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    console.log('Tentando login com:', email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha,
      });

      console.log('Resposta:', { data, error });

      if (error) {
        setErro('Credenciais de login inválidas');
        setLoading(false);
        return;
      }

      if (data?.session) {
        console.log('Login sucesso! Redirecionando...');
        window.location.href = '/';
      } else {
        setErro('Credenciais de login inválidas');
        setLoading(false);
      }
    } catch (err) {
      console.error('Erro:', err);
      setErro('Ocorreu um erro ao tentar entrar');
      setLoading(false);
    }
  };

  // --- Estilos Ultra Premium (1.000.000% de melhoria) ---

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #10b981 100%)',
    padding: '24px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: '420px',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '48px 40px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '40px',
  };

  const logoStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '4px',
    margin: '0 0 8px 0',
    background: 'linear-gradient(to right, #fff, #a0aec0)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textTransform: 'uppercase',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#718096',
    fontWeight: 400,
    letterSpacing: '0.5px',
  };

  const inputGroupStyle: React.CSSProperties = {
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#a0aec0',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    paddingLeft: '4px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 18px',
    fontSize: '15px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    outline: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  };

  const optionsRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    fontSize: '13px',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#cbd5e0',
    cursor: 'pointer',
    userSelect: 'none',
  };

  const checkboxInputStyle: React.CSSProperties = {
    width: '18px',
    height: '18px',
    borderRadius: '6px',
    accentColor: '#48bb78',
    cursor: 'pointer',
  };

  const linkStyle: React.CSSProperties = {
    color: '#48bb78',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'color 0.2s ease',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 700,
    color: '#ffffff',
    background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    letterSpacing: '1px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 10px 15px -3px rgba(72, 187, 120, 0.3)',
    textTransform: 'uppercase',
  };

  const errorBoxStyle: React.CSSProperties = {
    backgroundColor: 'rgba(245, 101, 101, 0.1)',
    border: '1px solid rgba(245, 101, 101, 0.2)',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '24px',
    color: '#fc8181',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const footerTextStyle: React.CSSProperties = {
    marginTop: '32px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#718096',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <header style={headerStyle}>
          <h1 style={logoStyle}>CONTINENTAL</h1>
          <p style={subtitleStyle}>Acesse sua conta com segurança</p>
        </header>

        {erro && (
          <div style={errorBoxStyle}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>E-mail de acesso</label>
            <input
              type="email"
              style={inputStyle}
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#48bb78';
                e.currentTarget.style.backgroundColor =
                  'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.boxShadow =
                  '0 0 0 4px rgba(72, 187, 120, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.backgroundColor =
                  'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              required
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Sua senha</label>
            <input
              type="password"
              style={inputStyle}
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#48bb78';
                e.currentTarget.style.backgroundColor =
                  'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.boxShadow =
                  '0 0 0 4px rgba(72, 187, 120, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.backgroundColor =
                  'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              required
            />
          </div>

          <div style={optionsRowStyle}>
            <label style={checkboxLabelStyle}>
              <input type="checkbox" style={checkboxInputStyle} />
              Lembrar-me
            </label>
            <a href="#" style={linkStyle}>
              Esqueceu a senha?
            </a>
          </div>

          <button
            type="submit"
            style={buttonStyle}
            disabled={loading}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow =
                '0 15px 20px -5px rgba(72, 187, 120, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow =
                '0 10px 15px -3px rgba(72, 187, 120, 0.3)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
            }}
          >
            {loading ? (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeOpacity="0.2"
                  />
                  <path
                    d="M12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04348 16.4522"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
                ENTRANDO...
              </span>
            ) : (
              'ENTRAR NA CONTA'
            )}
          </button>
        </form>

        <p style={footerTextStyle}>
          Não tem uma conta?{' '}
          <a href="#" style={linkStyle}>
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
}
