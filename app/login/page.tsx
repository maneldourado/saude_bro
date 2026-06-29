// app/login/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

// ─── Particle System ───
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    const PARTICLE_COUNT = 80;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      pulse: number;
      pulseSpeed: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.speedY = (Math.random() - 0.5) * 0.8;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.pulse = 0;
        this.pulseSpeed = Math.random() * 0.02 + 0.01;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulse += this.pulseSpeed;

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      draw() {
        const glow = Math.sin(this.pulse) * 0.2 + 0.8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(72, 187, 120, ${this.opacity * glow})`;
        ctx.fill();
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }

    const drawLines = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const opacity = (1 - dist / 150) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(72, 187, 120, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      drawLines();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

// ─── Animated Orb Background ───
function AnimatedOrbs() {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(72, 187, 120, 0.15) 0%, transparent 70%)',
          top: '-200px',
          right: '-200px',
          animation: 'float1 8s ease-in-out infinite',
          filter: 'blur(60px)',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(66, 153, 225, 0.12) 0%, transparent 70%)',
          bottom: '-150px',
          left: '-150px',
          animation: 'float2 10s ease-in-out infinite',
          filter: 'blur(60px)',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(159, 122, 234, 0.1) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'float3 12s ease-in-out infinite',
          filter: 'blur(80px)',
          zIndex: 0,
        }}
      />
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-60px, 40px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(40px, -50px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>
    </>
  );
}

// ─── Icons (SVG) ───
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 23 23">
    <rect x="1" y="1" width="10" height="10" fill="#F25022" />
    <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
    <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
    <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 7l-10 7L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#48bb78" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ─── Ripple Button Component ───
function RippleButton({
  children,
  onClick,
  disabled,
  style,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
    onClick(e);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={{
        ...style,
        position: 'relative',
        overflow: 'hidden',
        ...(!disabled ? { cursor: 'pointer' } : {}),
      }}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x - 50,
            top: ripple.y - 50,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.3)',
            animation: 'ripple 0.6s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes ripple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(4); opacity: 0; }
        }
      `}</style>
      {children}
    </button>
  );
}

// ─── Social Login Button Component ───
function SocialButton({
  icon,
  label,
  onClick,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      style={{
        width: '100%',
        padding: '14px',
        fontSize: '14px',
        fontWeight: 600,
        color: '#e2e8f0',
        background: hovered ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
        border: `1px solid ${hovered ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
        borderRadius: '14px',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: loading ? 0.6 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {loading ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
          <path d="M12 2C6.477 2 2 6.477 2 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : icon}
      <span>{label}</span>
    </button>
  );
}

// ─── Main Page ───
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [senhaValid, setSenhaValid] = useState<boolean | null>(null);
  const [cardVisible, setCardVisible] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCardVisible(true);
  }, []);

  // Email validation
  useEffect(() => {
    if (email === '') {
      setEmailValid(null);
      return;
    }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(re.test(email));
  }, [email]);

  // Password strength
  useEffect(() => {
    if (senha === '') {
      setSenhaValid(null);
      return;
    }
    setSenhaValid(senha.length >= 6);
  }, [senha]);

  // Password strength calculation
  const getPasswordStrength = useCallback(() => {
    if (senha === '') return 0;
    let score = 0;
    if (senha.length >= 6) score += 1;
    if (senha.length >= 8) score += 1;
    if (/[A-Z]/.test(senha)) score += 1;
    if (/[0-9]/.test(senha)) score += 1;
    if (/[^A-Za-z0-9]/.test(senha)) score += 1;
    return score;
  }, [senha]);

  const strength = getPasswordStrength();
  const strengthColor = strength <= 2 ? '#fc8181' : strength <= 3 ? '#f6e05e' : '#48bb78';
  const strengthLabel = strength <= 1 ? 'Muito fraca' : strength <= 2 ? 'Fraca' : strength <= 3 ? 'Razoável' : 'Forte';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      setErro('Preencha todos os campos');
      return;
    }
    setLoading(true);
    setErro('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) {
        setErro('Credenciais de login inválidas');
        setLoading(false);
        return;
      }

      if (data?.session) {
        setSucesso(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
        },
      });
      if (error) {
        setErro('Erro ao conectar com Google');
        setGoogleLoading(false);
      }
      // Se data.url existir, o Supabase já redireciona automaticamente
    } catch (err) {
      console.error('Erro Google:', err);
      setErro('Erro ao conectar com Google');
      setGoogleLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setMicrosoftLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email',
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
        },
      });
      if (error) {
        setErro('Erro ao conectar com Microsoft');
        setMicrosoftLoading(false);
      }
      // Se data.url existir, o Supabase já redireciona automaticamente
    } catch (err) {
      console.error('Erro Microsoft:', err);
      setErro('Erro ao conectar com Microsoft');
      setMicrosoftLoading(false);
    }
  };

  // ─── Styles ───
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a0e27 0%, #0f1729 25%, #1a1a3e 50%, #0f1729 75%, #0a0e27 100%)',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: '460px',
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    borderRadius: '28px',
    padding: '52px 44px 44px',
    boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset, 0 0 80px rgba(72, 187, 120, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    opacity: cardVisible ? 1 : 0,
    transform: cardVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
    transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'relative',
    zIndex: 1,
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '40px',
  };

  const logoIconStyle: React.CSSProperties = {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #48bb78, #38a169)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    fontSize: '24px',
    fontWeight: 800,
    color: '#fff',
    boxShadow: '0 8px 30px rgba(72, 187, 120, 0.3)',
  };

  const logoStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '6px',
    margin: '0 0 10px 0',
    background: 'linear-gradient(135deg, #ffffff 0%, #a0aec0 50%, #48bb78 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textTransform: 'uppercase',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: 400,
    letterSpacing: '0.5px',
  };

  const inputGroupStyle: React.CSSProperties = {
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    paddingLeft: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const getInputStyle = (valid: boolean | null): React.CSSProperties => ({
    width: '100%',
    padding: '14px 44px 14px 16px',
    fontSize: '15px',
    borderRadius: '14px',
    border: `1.5px solid ${
      valid === true ? 'rgba(72, 187, 120, 0.4)' : valid === false ? 'rgba(245, 101, 101, 0.4)' : 'rgba(255, 255, 255, 0.08)'
    }`,
    outline: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    color: '#e2e8f0',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box',
    ...(valid === true ? { boxShadow: '0 0 0 4px rgba(72, 187, 120, 0.08)' } : {}),
    ...(valid === false ? { boxShadow: '0 0 0 4px rgba(245, 101, 101, 0.08)' } : {}),
  });

  const optionsRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    fontSize: '13px',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#94a3b8',
    cursor: 'pointer',
    userSelect: 'none',
  };

  const checkboxInputStyle: React.CSSProperties = {
    width: '18px',
    height: '18px',
    borderRadius: '5px',
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
    fontSize: '15px',
    fontWeight: 700,
    color: '#ffffff',
    background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
    border: 'none',
    borderRadius: '14px',
    letterSpacing: '2px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 10px 25px -5px rgba(72, 187, 120, 0.35), 0 0 0 0 rgba(72, 187, 120, 0.1)',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  };

  const errorBoxStyle: React.CSSProperties = {
    backgroundColor: 'rgba(245, 101, 101, 0.08)',
    border: '1px solid rgba(245, 101, 101, 0.15)',
    borderRadius: '14px',
    padding: '14px 18px',
    marginBottom: '24px',
    color: '#fc8181',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    animation: 'shakeIn 0.5s ease',
  };

  const successBoxStyle: React.CSSProperties = {
    backgroundColor: 'rgba(72, 187, 120, 0.08)',
    border: '1px solid rgba(72, 187, 120, 0.15)',
    borderRadius: '14px',
    padding: '14px 18px',
    marginBottom: '24px',
    color: '#48bb78',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    animation: 'fadeInUp 0.5s ease',
  };

  const dividerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '24px 0',
    color: '#475569',
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '1px',
    textTransform: 'uppercase',
  };

  const socialButtonsStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const footerTextStyle: React.CSSProperties = {
    marginTop: '28px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#64748b',
  };

  const strengthBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    marginTop: '8px',
  };

  const strengthSegmentStyle = (index: number): React.CSSProperties => ({
    flex: 1,
    height: '3px',
    borderRadius: '2px',
    backgroundColor: index < strength ? strengthColor : 'rgba(255, 255, 255, 0.06)',
    transition: 'all 0.3s ease',
  });

  return (
    <div style={containerStyle}>
      <ParticleCanvas />
      <AnimatedOrbs />

      <div style={cardStyle} ref={cardRef}>
        {/* Logo & Header */}
        <header style={headerStyle}>
          <div style={logoIconStyle}>C</div>
          <h1 style={logoStyle}>CONTINENTAL</h1>
          <p style={subtitleStyle}>Acesse sua conta com segurança</p>
        </header>

        {/* Error / Success Messages */}
        {erro && (
          <div style={errorBoxStyle}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span>{erro}</span>
          </div>
        )}

        {sucesso && (
          <div style={successBoxStyle}>
            <span style={{ fontSize: '18px' }}>✅</span>
            <span>Login realizado com sucesso! Redirecionando...</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>
              <MailIcon />
              E-mail de acesso
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                style={getInputStyle(emailValid)}
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {emailValid === true && (
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#48bb78' }}>
                  <CheckIcon />
                </span>
              )}
            </div>
          </div>

          {/* Password */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>
              <LockIcon />
              Sua senha
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                style={getInputStyle(senhaValid)}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s ease',
                }}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {/* Password Strength Indicator */}
            {senha.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <div style={strengthBarStyle}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} style={strengthSegmentStyle(i)} />
                  ))}
                </div>
                <span style={{ fontSize: '11px', color: strengthColor, fontWeight: 500 }}>
                  {strengthLabel}
                </span>
              </div>
            )}
          </div>

          {/* Options Row */}
          <div style={optionsRowStyle}>
            <label style={checkboxLabelStyle}>
              <input type="checkbox" style={checkboxInputStyle} />
              Lembrar-me
            </label>
            <a href="#" style={linkStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#68d391')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#48bb78')}
            >
              Esqueceu a senha?
            </a>
          </div>

          {/* Submit Button */}
          <RippleButton
            type="submit"
            disabled={loading}
            style={{
              ...buttonStyle,
              opacity: loading ? 0.8 : 1,
              pointerEvents: loading ? 'none' : 'auto',
            }}
            onClick={handleLogin}
          >
            {loading ? (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ animation: 'spin 1s linear infinite' }}
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M12 2C6.477 2 2 6.477 2 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>ENTRANDO...</span>
              </>
            ) : (
              <>
                <span>ENTRAR NA CONTA</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </RippleButton>
        </form>

        {/* Social Login */}
        <div style={dividerStyle}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1))' }} />
          <span>ou continue com</span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.1))' }} />
        </div>

        <div style={socialButtonsStyle}>
          {/* Google */}
          <SocialButton
            icon={<GoogleIcon />}
            label="Continuar com Google"
            onClick={handleGoogleLogin}
            loading={googleLoading}
          />

          {/* Microsoft */}
          <SocialButton
            icon={<MicrosoftIcon />}
            label="Continuar com Microsoft"
            onClick={handleMicrosoftLogin}
            loading={microsoftLoading}
          />
        </div>

        {/* Footer */}
        <p style={footerTextStyle}>
          Não tem uma conta?{' '}
          <a href="#" style={linkStyle}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#68d391')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#48bb78')}
          >
            Cadastre-se agora
          </a>
        </p>
      </div>

      {/* Keyframe Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes shakeIn {
          0% { transform: translateX(-10px); opacity: 0; }
          25% { transform: translateX(5px); }
          50% { transform: translateX(-3px); }
          75% { transform: translateX(1px); }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
