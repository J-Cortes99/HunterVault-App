import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { igdbApi, type IgdbGameDetails } from '../api/igdb';
import { Loader2, ArrowLeft, Star, Calendar, Monitor, ChevronRight, Play } from 'lucide-react';

export function GameDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const igdbId = id ? parseInt(id) : undefined;

  const { data: details, isLoading, isError } = useQuery<IgdbGameDetails>({
    queryKey: ['igdb', 'details', igdbId],
    queryFn: () => igdbApi.getDetailsById(igdbId!),
    enabled: !!igdbId,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950">
        <Loader2 size={48} className="animate-spin text-amber-500" />
      </div>
    );
  }

  if (isError || !details) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-950 text-white">
        <h2 className="text-2xl font-bold text-red-400">Error al cargar detalles de IGDB</h2>
        <p className="text-slate-400">No hemos podido encontrar el juego con ID {igdbId} en IGDB.</p>
        <button
          onClick={() => navigate('/')}
          className="rounded-xl bg-amber-500/20 px-4 py-2 font-bold text-amber-300 transition-colors hover:bg-amber-500/40"
        >
          Volver a la Biblioteca
        </button>
      </div>
    );
  }

  // Formatting release date
  const releaseDateStr = details.firstReleaseDate
    ? new Date(details.firstReleaseDate * 1000).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Desconocida';

  // Use the best possible image for the banner background
  const bannerImg = details.screenshots && details.screenshots.length > 0 
    ? details.screenshots[0] 
    : details.coverUrl;

  return (
    <div className="min-h-screen bg-surface-950 text-white pb-20">
      {/* Banner hero section */}
      <div className="relative h-[25vh] sm:h-[40vh] w-full overflow-hidden">
        {bannerImg && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 brightness-[0.6] sepia-[0.3] hue-rotate-[10deg] transition-all animate-image-fade-in"
            style={{ backgroundImage: `url(${bannerImg})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/60 to-transparent" />
        
        {/* Top Navbar */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-xl bg-surface-900/60 backdrop-blur-md px-4 py-2 text-sm font-bold border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={16} /> VOLVER
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 -mt-24 sm:-mt-32">
        <div className="flex flex-col sm:flex-row gap-8">
          {/* Left Column: Cover & Quick Stats */}
          <div className="flex flex-col shrink-0 sm:w-64 gap-6">
            <div className="aspect-[3/4] w-full sm:w-64 overflow-hidden rounded-2xl shadow-2xl shadow-black/80 border border-white/10 bg-surface-900">
              {details.coverUrl ? (
                <img src={details.coverUrl} alt={details.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full justify-center items-center">
                  <Monitor size={48} className="text-surface-600" />
                </div>
              )}
            </div>

            <div className="glass rounded-2xl p-5 border border-white/5 space-y-4">
              {details.rating != null && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Valoración IGDB</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="text-amber-400" size={18} fill="currentColor" />
                    <span className="text-2xl font-bold">{Math.round(details.rating)}<span className="text-sm text-slate-400 font-normal">/100</span></span>
                  </div>
                </div>
              )}
              
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Lanzamiento</span>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="text-amber-500" size={18} />
                  <span className="text-sm font-medium">{releaseDateStr}</span>
                </div>
              </div>
            </div>
            
            {details.platforms && details.platforms.length > 0 && (
              <div className="glass rounded-2xl p-5 border border-white/5">
                 <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3 block">Plataformas</span>
                 <div className="flex flex-wrap gap-2">
                    {details.platforms.map((p: string) => (
                      <span key={p} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs">{p}</span>
                    ))}
                 </div>
              </div>
            )}

            {/* Time to Beat */}
            {(details.normally || details.completely) && (
              <div className="glass rounded-2xl p-5 border border-white/5 space-y-4">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Tiempo estimado (HLTB)</span>
                
                {details.normally && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Historia</span>
                    <span className="text-xs font-bold text-emerald-400">{Math.round(details.normally / 3600)}h</span>
                  </div>
                )}
                
                {details.completely && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Completista</span>
                    <span className="text-xs font-bold text-amber-400">{Math.round(details.completely / 3600)}h</span>
                  </div>
                )}
                
                {details.hastily && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Rápido</span>
                    <span className="text-xs font-bold text-sky-400">{Math.round(details.hastily / 3600)}h</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Info */}
          <div className="flex-1 flex flex-col gap-8">
            <div>
              <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-white mb-4 drop-shadow-lg">{details.name}</h1>
              <div className="flex flex-wrap gap-2 mb-6">
                {details.genres.map((g: string) => (
                  <span key={g} className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    {g}
                  </span>
                ))}
              </div>
              
              <div className="glass rounded-3xl p-6 sm:p-8 border border-white/5 leading-relaxed text-slate-300 text-sm sm:text-base">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 block">Sinopsis</span>
                <p className="whitespace-pre-line">{details.summary || 'No hay sinopsis disponible para este título en IGDB.'}</p>
              </div>
            </div>

            {/* Trailer */}
            {details.trailerYoutubeId && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Play size={18} className="text-red-500 fill-current" />
                  <h3 className="text-lg font-bold text-white">Trailer Oficial</h3>
                </div>
                <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${details.trailerYoutubeId}`}
                    title={`${details.name} Trailer`}
                    className="h-full w-full"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Screenshots Gallery */}
            {details.screenshots && details.screenshots.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-bold text-white">Galería</h3>
                  <ChevronRight size={16} className="text-amber-500" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {details.screenshots.map((img: string, idx: number) => (
                    <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-amber-500/50 transition-colors cursor-pointer group">
                       <img src={img} alt={`Screenshot ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}
