const TarjetaMetrica = ({ titulo, valor, detalle, icono: Icono, color = 'text-gray-400' }) => (
  <article className="tarjeta-sistema relative overflow-hidden rounded-2xl border border-white/10 bg-[#090909] p-5 shadow-xl">
    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-500">{titulo}</p>
    <h3 className="text-2xl font-black text-white">{valor}</h3>
    {detalle && <p className="mt-1 text-[10px] font-bold text-gray-400">{detalle}</p>}
    <div className={`absolute right-4 top-1/2 -translate-y-1/2 rounded-xl bg-white/5 p-3 transition-transform group-hover:scale-110 ${color}`}>
      <Icono size={22} />
    </div>
  </article>
);

export default TarjetaMetrica;
