export function SkeletonCard() {
  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="skeleton h-6 w-24" />
        <div className="skeleton h-4 w-8" />
      </div>
      <div className="skeleton h-6 w-3/4" />
      <div className="skeleton h-4 w-1/2" />
      <div className="flex flex-col gap-2">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-4 w-32" />
      </div>
      <div className="flex gap-2 border-t border-white/5 pt-4">
        <div className="skeleton h-8 flex-1" />
        <div className="skeleton h-8 flex-1" />
      </div>
    </div>
  );
}
