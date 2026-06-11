import React from 'react';
import './App.css';
import Logo from './assets/logo-web-main.png';

const menuItems = [
  { key: 'home', label: 'Inicio', active: true },
  { key: 'scan', label: 'Check-in' },
  { key: 'userAdd', label: 'Registrar socio' },
  { key: 'money', label: 'Pagos' },
  { key: 'card', label: 'Membresias' },
  { key: 'calendar', label: 'Asistencias' },
  { key: 'bell', label: 'Notificaciones' },
  { key: 'profile', label: 'Perfil' },
];

const stats = [
  { key: 'users', title: 'Check-ins de hoy', value: '64' },
  { key: 'money', title: 'Pagos registrados', value: '$1,280' },
  { key: 'calendarWarn', title: 'Membresias por vencer', value: '9' },
  { key: 'userAdd', title: 'Nuevos socios', value: '6' },
];

const recentPayments = [
  { name: 'Juan Perez', plan: 'Premium', amount: '$600', date: '12/05/2024', state: 'Pagado' },
  { name: 'Maria Gomez', plan: 'Basica', amount: '$450', date: '12/05/2024', state: 'Pagado' },
  { name: 'Carlos Ramirez', plan: 'Premium', amount: '$600', date: '11/05/2024', state: 'Pagado' },
  { name: 'Ana Torres', plan: 'Elite', amount: '$800', date: '11/05/2024', state: 'Pagado' },
];

const expirations = [
  { name: 'Luis Hernandez', plan: 'Basica', date: '18/05/2024', left: '6 dias' },
  { name: 'Fernanda Lopez', plan: 'Premium', date: '20/05/2024', left: '8 dias' },
  { name: 'Roberto Silva', plan: 'Elite', date: '23/05/2024', left: '11 dias' },
  { name: 'Daniela Castro', plan: 'Basica', date: '25/05/2024', left: '13 dias' },
];

function Icon({ name, className = 'h-5 w-5' }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.9',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  switch (name) {
    case 'home':
      return <svg {...common}><path d="M3 10.8 12 4l9 6.8" /><path d="M5.5 10.5V20h13v-9.5" /><path d="M10 20v-4.8h4V20" /></svg>;
    case 'scan':
      return <svg {...common}><path d="M4 8V4h4" /><path d="M20 8V4h-4" /><path d="M4 16v4h4" /><path d="M20 16v4h-4" /><path d="M8 8h2v2H8z" /><path d="M14 8h2v2h-2z" /><path d="M8 14h2v2H8z" /><path d="M14 14h2v2h-2z" /></svg>;
    case 'userAdd':
      return <svg {...common}><circle cx="10" cy="8" r="3.2" /><path d="M4.5 19c0-3 2.3-5 5.5-5" /><path d="M17.5 9v6" /><path d="M14.5 12h6" /></svg>;
    case 'money':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7.2v9.6" /><path d="M14.7 9.2h-3a1.8 1.8 0 1 0 0 3.6h.6a1.8 1.8 0 1 1 0 3.6H9" /></svg>;
    case 'card':
      return <svg {...common}><rect x="3" y="6" width="18" height="12" rx="2.4" /><path d="M3 10h18" /><path d="M7 14h3.8" /></svg>;
    case 'calendar':
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2.4" /><path d="M7 3v4" /><path d="M17 3v4" /><path d="M3 10h18" /><path d="m8 15 2 2 4-4" /></svg>;
    case 'calendarWarn':
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2.4" /><path d="M7 3v4" /><path d="M17 3v4" /><path d="M3 10h18" /><path d="M12 13v4" /><path d="M12 19h.01" /></svg>;
    case 'bell':
      return <svg {...common}><path d="M6.8 16h10.4c-1.1-1.1-1.7-2.4-1.7-4v-1c0-2.2-1.5-3.9-3.5-4.4V6a1 1 0 1 0-2 0v.6A4.6 4.6 0 0 0 6.5 11v1c0 1.6-.6 2.9-1.7 4z" /><path d="M9.6 18a2.4 2.4 0 0 0 4.8 0" /></svg>;
    case 'profile':
      return <svg {...common}><circle cx="12" cy="8" r="3.4" /><path d="M5 20c0-3.2 2.7-5.4 7-5.4s7 2.2 7 5.4" /></svg>;
    case 'users':
      return <svg {...common}><circle cx="9" cy="9" r="2.5" /><circle cx="16" cy="8" r="2" /><path d="M4.5 18c.6-2.4 2.5-3.8 4.5-3.8s3.9 1.4 4.5 3.8" /><path d="M14.3 14.7c1.7.2 3.1 1.3 3.7 3.3" /></svg>;
    case 'bolt':
      return <svg {...common}><path d="M13.2 2 6 13.2h4.5L9.9 22l8.1-11.3h-4.6z" /></svg>;
    case 'wallet':
      return <svg {...common}><path d="M3.5 8.5h14.8A2.2 2.2 0 0 1 20.5 10v7.2a2.3 2.3 0 0 1-2.3 2.3H5.8a2.3 2.3 0 0 1-2.3-2.3V8.5Z" /><path d="M3.5 8.5V7a2.5 2.5 0 0 1 2.5-2.5h11" /><path d="M17 14h3.5" /></svg>;
    case 'badge':
      return <svg {...common}><rect x="3" y="7" width="18" height="12" rx="2" /><circle cx="8" cy="13" r="2" /><path d="M12 11h6" /><path d="M12 15h4" /></svg>;
    case 'menu':
      return <svg {...common}><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></svg>;
    case 'search':
      return <svg {...common}><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /></svg>;
    case 'chevron':
      return <svg {...common}><path d="m9 6 6 6-6 6" /></svg>;
    default:
      return null;
  }
}

function Sidebar() {
  return (
    <aside className="dashboard-sidebar hidden lg:flex lg:w-[20%] lg:min-w-66.25 xl:min-w-71.25 2xl:min-w-75 flex-col border-r border-[#171717]">
      <div className="px-6 pt-5 pb-4">
        <img src={Logo} alt="Spartan Gym" className="w-44 object-contain" />
      </div>

      <nav className="px-4 pb-6 space-y-1.5">
        {menuItems.map((item) => (
          <button key={item.key} className={`sidebar-item ${item.active ? 'sidebar-item-active' : ''}`}>
            <Icon name={item.key} className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="h-18 border-b border-[#171717] px-6 xl:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 text-white/90 min-w-55">
        <button className="text-white/70 hover:text-white transition-colors lg:hidden" aria-label="Abrir menu">
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <p className="text-[14px] font-semibold tracking-tight">Panel de recepcionista</p>
      </div>

      <div className="hidden md:flex items-center gap-2 bg-[#0c0c0d] border border-[#1a1a1a] rounded-xl h-11 px-4 w-90 lg:w-105">
        <Icon name="search" className="h-4 w-4 text-white/40" />
        <input
          type="text"
          placeholder="Buscar..."
          className="bg-transparent outline-none border-none w-full text-sm placeholder:text-white/35"
        />
      </div>

      <div className="flex items-center gap-4 min-w-62.5 justify-end">
        <button className="relative h-10 w-10 rounded-full border border-[#242424] bg-[#0d0d0d] text-white/80 flex items-center justify-center hover:text-white">
          <Icon name="bell" className="h-5 w-5" />
          <span className="absolute right-0.5 top-0.5 h-4 min-w-4 rounded-full bg-[#d90f18] text-[10px] font-bold text-white leading-4 px-1">3</span>
        </button>

        <div className="hidden sm:flex items-center gap-3">
          <div className="h-11 w-11 rounded-full border border-[#cb101a] bg-[#101012] text-[#cb101a] flex items-center justify-center">
            <Icon name="profile" className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm text-white font-medium">Recepcionista</p>
            <p className="text-xs text-white/45">recepcion@spartangym.com</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <article className="dashboard-card h-20.5 px-4 lg:px-5 py-3 flex items-center gap-3">
      <div className="icon-ring h-11 w-11 rounded-full flex items-center justify-center text-[#e0111b]">
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11.5px] text-white/65 leading-4 truncate">{title}</p>
        <p className="text-[24px] leading-[1.05] font-bold text-white tracking-tight">{value}</p>
      </div>
      <div className="ml-auto text-white/35">
        <Icon name="chevron" className="h-4 w-4" />
      </div>
    </article>
  );
}

function FeatureCard({ title, description, actionLabel, visual }) {
  return (
    <article className="dashboard-card px-5 py-5 md:px-6 md:py-6 h-53.5 relative overflow-hidden">
      <div className="relative z-10 flex h-full flex-col max-w-[52%]">
        <h3 className="text-[17px] leading-6 text-white font-semibold tracking-tight mb-2">{title}</h3>
        <p className="text-[12px] leading-6 text-white/70 mb-4">{description}</p>
        <button className="action-btn mt-auto">
          {actionLabel}
          <Icon name="chevron" className="h-4 w-4" />
        </button>
      </div>

      {visual === 'qr' ? (
        <div className="qr-visual absolute right-4 bottom-4 w-[42%] h-[84%] rounded-2xl border border-white/10">
          <div className="text-[11px] text-white/75 mb-2">Escanear codigo QR</div>
          <div className="relative bg-white rounded-lg h-24.5 w-24.5 grid grid-cols-4 gap-1 p-2">
            {Array.from({ length: 16 }).map((_, idx) => (
              <div key={idx} className={idx % 3 === 0 || idx === 5 || idx === 10 ? 'bg-black rounded-[1px]' : 'bg-zinc-300 rounded-[1px]'} />
            ))}
          </div>
          <div className="mt-3 text-xs text-[#8ce7a2] font-semibold">Membresia activa</div>
          <div className="text-[11px] text-[#5aa46b]">Acceso permitido</div>
        </div>
      ) : (
        <div className="monitor-visual absolute right-5 bottom-4 w-[40%] h-[76%] rounded-2xl border border-white/15 p-3">
          <div className="h-full rounded-xl border border-white/10 bg-black/45 p-3">
            <div className="text-[11px] text-white/70 mb-3">Nuevo socio</div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-5 rounded bg-white/5 border border-white/10" />
              ))}
            </div>
            <div className="h-6 w-24 rounded bg-[#d90f18] mt-3 ml-auto" />
          </div>
        </div>
      )}
    </article>
  );
}

function TablePanel({ title, columns, rows, actionText, type }) {
  return (
    <section className="dashboard-card p-5 xl:p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[#e0111b]"><Icon name={type === 'payments' ? 'money' : 'calendarWarn'} className="h-5 w-5" /></span>
        <h4 className="text-[17px] text-white font-semibold tracking-tight">{title}</h4>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-2 text-[11.5px]">
          <thead>
            <tr className="text-white/55">
              {columns.map((column) => (
                <th key={column} className="font-medium pb-1.5">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.name}-${index}`} className="text-white/90 table-row-skin">
                <td className="py-1.5 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-full bg-linear-to-br from-[#7f684f] to-[#342922] border border-white/10" />
                    <span>{row.name}</span>
                  </div>
                </td>
                <td className="py-1.5 text-white/75">{row.plan}</td>
                {type === 'payments' ? (
                  <>
                    <td className="py-1.5 text-white/75">{row.amount}</td>
                    <td className="py-1.5 text-white/75">{row.date}</td>
                  </>
                ) : (
                  <td className="py-1.5 text-white/75">{row.date}</td>
                )}
                {type === 'payments' ? (
                  <td className="py-1.5">
                    <span className="status-pill bg-[#11451f] text-[#9de6ad] border border-[#1f6e34]">{row.state}</span>
                  </td>
                ) : (
                  <td className="py-1.5">
                    <span className="text-[#e6be4e] font-semibold">{row.left}</span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="text-[#e0111b] text-sm mt-2 font-semibold tracking-wide hover:text-red-400 inline-flex items-center gap-2">
        {actionText}
        <Icon name="chevron" className="h-4 w-4" />
      </button>
    </section>
  );
}

function QuickAccessCard({ icon, label }) {
  return (
    <button className="dashboard-card h-15.5 px-5 flex items-center justify-between text-left hover:border-[#4b2325] transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-[#e0111b]"><Icon name={icon} className="h-5 w-5" /></span>
        <span className="text-[13px] text-white/90 font-medium tracking-tight">{label}</span>
      </div>
      <span className="text-white/45"><Icon name="chevron" className="h-4 w-4" /></span>
    </button>
  );
}

function SpartanDashboard() {
  return (
    <div className="h-screen bg-[#040405] text-[#ebebeb] overflow-hidden flex">
      <Sidebar />

      <main className="flex-1 min-w-0 flex flex-col">
        <Topbar />

        <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-5 xl:px-8 xl:py-6 space-y-4 xl:space-y-5">
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {stats.map((item) => (
              <StatCard key={item.key} icon={item.key} title={item.title} value={item.value} />
            ))}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FeatureCard
              title="Control de acceso"
              description="Valida la membresia activa de los socios y registra su check-in para ingresar al gimnasio."
              actionLabel="Registrar check-in"
              visual="qr"
            />
            <FeatureCard
              title="Registro de nuevos socios"
              description="Crea nuevos registros de clientes y asignales el plan de membresia que mejor se adapte a sus objetivos."
              actionLabel="Registrar socio"
              visual="monitor"
            />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TablePanel
              title="Pagos recientes"
              columns={['Socio', 'Membresia', 'Monto', 'Fecha', 'Estado']}
              rows={recentPayments}
              actionText="Ver todos los pagos"
              type="payments"
            />
            <TablePanel
              title="Proximos vencimientos"
              columns={['Socio', 'Membresia', 'Vence el', 'Dias restantes']}
              rows={expirations}
              actionText="Ver todos los vencimientos"
              type="expirations"
            />
          </section>

          <section className="dashboard-card p-4 xl:p-5">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr_1fr] gap-3">
              <div className="h-16.5 px-4 flex items-center gap-3 text-white">
                <span className="text-[#e0111b]"><Icon name="bolt" className="h-5 w-5" /></span>
                <h5 className="text-[17px] font-semibold tracking-tight">Accesos rapidos</h5>
              </div>
              <QuickAccessCard icon="wallet" label="Cobrar mensualidad" />
              <QuickAccessCard icon="badge" label="Validar membresia" />
              <QuickAccessCard icon="userAdd" label="Nuevo socio" />
            </div>
          </section>

          <footer className="px-1 text-xs text-white/45 flex items-center justify-between pb-1">
            <p>© {new Date().getFullYear()} Spartan Gym. Todos los derechos reservados.</p>
            <p>Version 1.0.0</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default SpartanDashboard;