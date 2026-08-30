import { notFound } from 'next/navigation';
import { getPilotById } from '@/lib/db';
import { PilotForm } from '@/components/PilotForm';
import { DeletePilotButton } from '@/components/DeletePilotButton';
import { deletePilotAction, updatePilotAction } from '@/lib/actions';

export default async function EditPilotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const pilot = Number.isFinite(id) ? getPilotById(id) : undefined;
  if (!pilot) notFound();

  const boundUpdate = updatePilotAction.bind(null, pilot.id);
  const boundDelete = deletePilotAction.bind(null, pilot.id);

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {pilot.firstName} {pilot.lastName}
        </h1>
        <DeletePilotButton action={boundDelete} pilotName={`${pilot.firstName} ${pilot.lastName}`} />
      </div>
      <PilotForm pilot={pilot} action={boundUpdate} submitLabel="Enregistrer les modifications" />
    </div>
  );
}
