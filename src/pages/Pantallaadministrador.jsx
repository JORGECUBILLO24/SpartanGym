import '../App.css';
import Logo from '../assets/logo-web-main.png';

const menuItems = [
	{ key: 'home', label: 'Inicio', active: true },
	{ key: 'users', label: 'Usuarios' },
	{ key: 'card', label: 'Membresías' },
	{ key: 'money', label: 'Finanzas' },
	{ key: 'wallet', label: 'Inventario' },
	{ key: 'reports', label: 'Reportes' },
	{ key: 'menu', label: 'Configuración' },
];

const stats = [
	{ key: 'users', title: 'Socios activos', value: '128' },
	{ key: 'money', title: 'Ingresos del mes', value: '$4,850' },
	{ key: 'calendarWarn', title: 'Membresías por vencer', value: '17' },
	{ key: 'userAdd', title: 'Personal registrado', value: '12' },
];

const featureCards = [
	{
		title: 'Gestión de usuarios',
		description: 'Administra socios, entrenadores y recepción',
		actionLabel: 'Ver usuarios',
		visual: 'monitor',
	},
	{
		title: 'Tipos de membresía',
		description: 'Configura planes diarios, quincenales, mensuales y anuales',
		actionLabel: 'Configurar',
		visual: 'monitor',
	},
	{
		title: 'Reportes financieros',
		description: 'Consulta ingresos, pagos y movimientos recientes',
		actionLabel: 'Ver reportes',
		visual: 'monitor',
	},
	{
		title: 'Inventario',
		description: 'Controla productos, stock y alertas de bajo inventario',
		actionLabel: 'Ver inventario',
		visual: 'monitor',
	},
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
		case 'reports':
			return <svg {...common}><path d="M5 19V5" /><path d="M5 19h14" /><path d="M8 16v-5" /><path d="M12 16V8" /><path d="M16 16v-3" /></svg>;
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
				<p className="text-[14px] font-semibold tracking-tight">Panel de administrador</p>
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
						<p className="text-sm text-white font-medium">Administrador</p>
						<p className="text-xs text-white/45">admin@spartangym.com</p>
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

function FeatureCard({ title, description, actionLabel }) {
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

			<div className="monitor-visual absolute right-5 bottom-4 w-[40%] h-[76%] rounded-2xl border border-white/15 p-3">
				<div className="h-full rounded-xl border border-white/10 bg-black/45 p-3">
					<div className="text-[11px] text-white/70 mb-3">{actionLabel}</div>
					<div className="space-y-2">
						{Array.from({ length: 5 }).map((_, idx) => (
							<div key={idx} className="h-5 rounded bg-white/5 border border-white/10" />
						))}
					</div>
					<div className="h-6 w-24 rounded bg-[#d90f18] mt-3 ml-auto" />
				</div>
			</div>
		</article>
	);
}

function SpartanAdmin() {
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
						{featureCards.slice(0, 2).map((f, i) => (
							<FeatureCard key={i} title={f.title} description={f.description} actionLabel={f.actionLabel} visual={f.visual} />
						))}
					</section>

					<section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						{featureCards.slice(2, 4).map((f, i) => (
							<FeatureCard key={i} title={f.title} description={f.description} actionLabel={f.actionLabel} visual={f.visual} />
						))}
					</section>

					<footer className="px-1 text-xs text-white/45 flex items-center justify-between pb-1">
						<p>© {new Date().getFullYear()} Spartan Gym. Todos los derechos reservados.</p>
						<p>Versión 1.0.0</p>
					</footer>
				</div>
			</main>
		</div>
	);
}

export default SpartanAdmin;

