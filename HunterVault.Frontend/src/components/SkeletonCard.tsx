export function SkeletonCard() {
  return (
    <div className="hud-clip hud-panel-bordered flex flex-col overflow-hidden animate-fade-in">
      <div className="skeleton aspect-[3/4] w-full" />
      <div className="flex flex-col gap-3 p-5">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-5 w-3/4" />
        <div className="grid grid-cols-2 gap-2 border-y border-signal-400/15 py-3">
          <div className="flex flex-col gap-1.5">
            <div className="skeleton h-2.5 w-16" />
            <div className="skeleton h-3 w-12" />
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <div className="skeleton h-2.5 w-16" />
            <div className="skeleton h-3 w-12" />
          </div>
        </div>
        <div className="skeleton h-1.5 w-full" />
        <div className="flex gap-2 mt-1">
          <div className="skeleton h-9 flex-1" />
          <div className="skeleton h-9 w-9" />
        </div>
      </div>
    </div>
  );
}
