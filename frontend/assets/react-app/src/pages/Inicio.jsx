export default function Inicio() {
  return (
    <div className="relative h-full min-h-[600px] rounded-2xl overflow-hidden shadow-2xl group">
      <img 
        src="/recursos/image/fondo.jpeg" 
        alt="Moto" 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>

      <div className="relative z-10 flex flex-col justify-center h-full p-12 max-w-2xl">
        <div className="bg-surface/40 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider mb-6 border border-primary/30">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Bienvenido, Lucía
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-white leading-tight uppercase tracking-tighter mb-6">
            Tu próxima <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-primary to-purple-500">
              moto ideal
            </span>
          </h1>
          
          <p className="text-textSecondary text-lg mb-8 max-w-md leading-relaxed">
            Explora nuestro catálogo exclusivo, simula tu financiamiento al instante y encuentra el modelo perfecto para dominar las calles.
          </p>
          
          <div className="flex gap-4">
            <a href="/catalogo" className="bg-primary hover:bg-primaryHover text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-transform hover:-translate-y-1 shadow-[0_8px_24px_rgba(59,130,246,0.4)]">
              Explorar Catálogo <span>→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}