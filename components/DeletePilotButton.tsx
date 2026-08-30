'use client';

export function DeletePilotButton({ action, pilotName }: { action: () => void; pilotName: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Supprimer définitivement ${pilotName} ?`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
      >
        Supprimer
      </button>
    </form>
  );
}
