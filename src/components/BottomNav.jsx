/**
 * Bottom Navigation — Mobile only (hidden on desktop)
 * 5 quick-access routes for the most common doctor actions.
 */
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Stethoscope, Pill, Shield } from 'lucide-react';

const DOCTOR_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/doctor-appointments', icon: Stethoscope, label: 'Patients' },
  { to: '/patients', icon: Users, label: 'Records' },
  { to: '/medicines', icon: Pill, label: 'Meds' },
  { to: '/clinical-audit', icon: Shield, label: 'Audit' },
];

const ADMIN_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/patients', icon: Users, label: 'Patients' },
  { to: '/appointments', icon: Stethoscope, label: 'OPD' },
  { to: '/medicines', icon: Pill, label: 'Meds' },
  { to: '/clinical-audit', icon: Shield, label: 'Audit' },
];

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const items = user.role === 'Doctor' ? DOCTOR_NAV : ADMIN_NAV;

  return (
    <nav className="bottom-nav">
      {items.map(item => {
        const Icon = item.icon;
        const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
        return (
          <NavLink key={item.to} to={item.to} className={`bottom-nav-item${active ? ' active' : ''}`}>
            <Icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
