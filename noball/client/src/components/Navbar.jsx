import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

const navStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: 'var(--navbar-height)',
  background: 'var(--bg-secondary)',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  zIndex: 1000,
  backdropFilter: 'blur(10px)',
};

const logoStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: '28px',
  letterSpacing: '3px',
  color: 'var(--text-primary)',
  textDecoration: 'none',
};

const logoAccent = {
  color: 'var(--accent-blue)',
};

const navLinks = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
};

const linkStyle = (active) => ({
  padding: '8px 14px',
  borderRadius: 'var(--radius-sm)',
  fontSize: '13px',
  fontWeight: active ? '700' : '500',
  color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
  background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
  textDecoration: 'none',
  transition: 'all 0.2s',
});

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path ||
    (path !== '/' && location.pathname.startsWith(path));

  return (
    <nav style={navStyle}>
      <Link to="/" style={logoStyle}>
        no<span style={logoAccent}>Ball</span>
      </Link>

      <div style={navLinks}>
        <Link to="/browse" style={linkStyle(isActive('/browse'))}>Duals</Link>
        <Link to="/market" style={linkStyle(isActive('/market'))}>Market</Link>
        <Link to="/rankings" style={linkStyle(isActive('/rankings'))}>Rankings</Link>

        {user ? (
          <>
            <Link to="/friends" style={linkStyle(isActive('/friends'))}>Friends</Link>
            <Link to="/profile" style={linkStyle(isActive('/profile'))}>
              {user.display_name || user.username}
            </Link>
            <button
              onClick={() => { logout(); navigate('/'); }}
              style={{
                ...linkStyle(false),
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={linkStyle(isActive('/login'))}>Login</Link>
            <Link
              to="/register"
              style={{
                ...linkStyle(false),
                background: 'var(--accent-blue)',
                color: 'white',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
