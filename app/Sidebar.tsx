// app/components/Sidebar.tsx
'use client';

import { useState, useEffect } from 'react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  menuItems: { id: string; icon: string; label: string }[];
  activeModule: string;
  setActiveModule: (id: string) => void;
  styles: any;
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
  styles,
  user,
  perfil,
  onLogout,
}: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Detectar tamanho da tela
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 767);
      setIsTablet(width >= 768 && width <= 1023);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fechar menu mobile ao clicar em um item
  const handleNavigation = (moduleId: string) => {
    setActiveModule(moduleId);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Determinar largura do sidebar
  let sidebarWidth = '280px';
  if (collapsed && !isMobile && !isTablet) {
    sidebarWidth = '80px';
  } else if (isTablet && !collapsed && !mobileOpen) {
    sidebarWidth = '240px';
  } else if (isTablet && collapsed && !mobileOpen) {
    sidebarWidth = '70px';
  } else if (isMobile) {
    sidebarWidth = '260px';
  }

  // Classes CSS para responsividade
  const sidebarClass = `
    sidebar
    ${collapsed && !isMobile && !isTablet ? 'sidebar-collapsed' : ''}
    ${isTablet && collapsed ? 'sidebar-tablet-collapsed' : ''}
    ${mobileOpen ? 'sidebar-mobile-open' : ''}
  `;

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      alert('Sair do sistema');
    }
  };

  // Nome do usuário para exibir
  const nomeUsuario =
    perfil?.nome ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Usuário';
  const cargoUsuario = perfil?.cargo || 'Colaborador';
  const perfilTipo = perfil?.perfil || 'usuario';
  const primeiraLetra = nomeUsuario.charAt(0).toUpperCase();

  const getPerfilTexto = () => {
    if (perfilTipo === 'admin') return 'Administrador';
    if (perfilTipo === 'medico') return 'Médico';
    if (perfilTipo === 'enfermeiro') return 'Enfermeiro';
    return 'Usuário';
  };

  // ===== ESTILOS RESPONSIVOS ADICIONAIS =====
  const mobileStyles = {
    sidebarHeader: {
      padding: isMobile ? '12px 16px' : '32px 24px',
    },
    logoText: {
      fontSize: isMobile ? '14px' : '20px',
    },
    navItem: {
      padding: isMobile ? '10px 14px' : '14px 18px',
      fontSize: isMobile ? '13px' : '14px',
      borderRadius: isMobile ? '10px' : '16px',
    },
    navIcon: {
      fontSize: isMobile ? '16px' : '18px',
    },
    userInfo: {
      padding: isMobile ? '12px 16px' : '20px',
    },
    userAvatar: {
      width: isMobile ? '32px' : '40px',
      height: isMobile ? '32px' : '40px',
      fontSize: isMobile ? '14px' : '18px',
    },
    userName: {
      fontSize: isMobile ? '13px' : '14px',
    },
    userCargo: {
      fontSize: isMobile ? '10px' : '11px',
    },
    logoutBtn: {
      padding: isMobile ? '10px 14px' : '14px 18px',
      fontSize: isMobile ? '13px' : '14px',
    },
  };

  return (
    <>
      {/* Overlay para celular */}
      {isMobile && mobileOpen && (
        <div
          className="sidebar-overlay active"
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 998,
          }}
        />
      )}

      <aside
        className={sidebarClass}
        style={{
          ...styles.sidebar,
          width: sidebarWidth,
          position: 'fixed',
          left: isMobile && !mobileOpen ? `-${sidebarWidth}` : '0',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 999,
          overflowX: 'hidden',
        }}
      >
        {/* HEADER */}
        <div style={{ ...styles.sidebarHeader, ...mobileStyles.sidebarHeader }}>
          <div style={styles.logo}>
            <i className="fas fa-heartbeat" style={styles.logoIcon}></i>
            {(!collapsed || isMobile || isTablet) && (
              <span style={{ ...styles.logoText, ...mobileStyles.logoText }}>
                {isMobile ? 'CONTINENTAL' : 'CONTINENTAL SAÚDE'}
              </span>
            )}
          </div>

          {!isMobile && (
            <button
              style={styles.toggleBtn}
              onClick={() => setCollapsed(!collapsed)}
            >
              <i
                className={`fas fa-chevron-${collapsed ? 'right' : 'left'}`}
              ></i>
            </button>
          )}

          {isMobile && mobileOpen && (
            <button
              style={{
                ...styles.toggleBtn,
                position: 'absolute',
                right: '15px',
                top: '15px',
                zIndex: 10,
              }}
              onClick={() => setMobileOpen(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {/* MENU */}
        <nav style={styles.sidebarNav}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              style={{
                ...styles.navItem,
                ...mobileStyles.navItem,
                ...(activeModule === item.id ? styles.navItemActive : {}),
                justifyContent:
                  collapsed && !isMobile && !isTablet ? 'center' : 'flex-start',
                gap: collapsed && !isMobile && !isTablet ? '0' : '14px',
              }}
              onClick={() => handleNavigation(item.id)}
              title={isMobile || (collapsed && !isMobile) ? item.label : ''}
            >
              <i className={`fas ${item.icon}`} style={{ ...styles.navIcon, ...mobileStyles.navIcon }}></i>
              {(!collapsed || isMobile || isTablet) && (
                <span style={styles.navLabel}>{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* USUÁRIO (versão expandida) */}
        {user && (!collapsed || isMobile || isTablet) && (
          <div
            style={{
              ...mobileStyles.userInfo,
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              marginTop: 'auto',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  ...mobileStyles.userAvatar,
                  borderRadius: '12px',
                  background:
                    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: 'white',
                  boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)',
                }}
              >
                {primeiraLetra}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    ...mobileStyles.userName,
                    fontWeight: 700,
                    color: 'white',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {nomeUsuario}
                </div>
                <div
                  style={{
                    ...mobileStyles.userCargo,
                    color: '#94a3b8',
                    fontWeight: 500,
                  }}
                >
                  {cargoUsuario}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USUÁRIO (versão colapsada) */}
        {user && collapsed && !isMobile && !isTablet && (
          <div
            style={{
              padding: '20px 0',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              marginTop: 'auto',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '18px',
                color: 'white',
                margin: '0 auto',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)',
              }}
              title={nomeUsuario}
            >
              {primeiraLetra}
            </div>
          </div>
        )}

        {/* FOOTER - BOTÃO SAIR */}
        <div style={styles.sidebarFooter}>
          <button
            style={{
              ...styles.logoutBtnSidebar,
              ...mobileStyles.logoutBtn,
              justifyContent:
                collapsed && !isMobile && !isTablet ? 'center' : 'flex-start',
              gap: collapsed && !isMobile && !isTablet ? '0' : '14px',
            }}
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt"></i>
            {(!collapsed || isMobile || isTablet) && <span>Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
