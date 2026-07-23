// app/Sidebar.tsx
'use client';

import { useState, useEffect } from 'react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  menuItems: { id: string; icon: string; label: string }[];
  activeModule: string;
  setActiveModule: (id: string) => void;
  user?: any;
  perfil?: any;
  onLogout?: () => void;
}

export default function Sidebar({
  collapsed,
  setCollapsed,
  menuItems,
  activeModule,
  setActiveModule,
  user,
  perfil,
  onLogout,
}: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const handleNav = (id: string) => {
    setActiveModule(id);
    if (isMobile) setMobileOpen(false);
  };

  const nome = perfil?.nome || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const cargo = perfil?.cargo || 'Colaborador';
  const letra = nome.charAt(0).toUpperCase();

  const width = isMobile ? '280px' : (collapsed ? '72px' : '240px');

  return (
    <>
      {/* Overlay mobile */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
          }}
        />
      )}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: isMobile && !mobileOpen ? `-${width}` : '0',
          width: width,
          height: '100vh',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          color: '#e2e8f0',
          transition: 'left 0.3s ease, width 0.3s ease',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            minHeight: '70px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: collapsed && !isMobile ? '0' : '16px',
              fontWeight: 700,
              color: '#10b981',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            <i className="fas fa-heartbeat" style={{ fontSize: '24px', color: '#10b981' }}></i>
            {(!collapsed || isMobile) && <span>Continental</span>}
          </div>
          {isMobile ? (
            <button
              onClick={() => setMobileOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
            >
              <i className="fas fa-times"></i>
            </button>
          ) : (
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <i className={`fas fa-chevron-${collapsed ? 'right' : 'left'}`}></i>
            </button>
          )}
        </div>

        {/* MENU */}
        <nav
          style={{
            flex: 1,
            padding: '16px 12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeModule === item.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: activeModule === item.id ? '#10b981' : '#94a3b8',
                cursor: 'pointer',
                width: '100%',
                fontSize: '14px',
                fontWeight: activeModule === item.id ? 600 : 500,
                transition: 'all 0.2s ease',
                justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
              }}
              onClick={() => handleNav(item.id)}
              title={collapsed && !isMobile ? item.label : ''}
            >
              <i className={`fas ${item.icon}`} style={{ fontSize: '18px', width: '20px', textAlign: 'center' }}></i>
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* USUÁRIO */}
        {user && (
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '18px',
                color: 'white',
                flexShrink: 0,
              }}
            >
              {letra}
            </div>
            {(!collapsed || isMobile) && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {nome}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{cargo}</div>
              </div>
            )}
          </div>
        )}

        {/* LOGOUT */}
        <div style={{ padding: '0 12px 16px 12px' }}>
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '10px',
              border: 'none',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              cursor: 'pointer',
              width: '100%',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
              marginBottom: '8px',
            }}
          >
            <i className="fas fa-sign-out-alt"></i>
            {(!collapsed || isMobile) && <span>Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
