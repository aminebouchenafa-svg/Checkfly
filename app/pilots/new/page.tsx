import { PilotForm } from '@/components/PilotForm';
import { createPilotAction } from '@/lib/actions';

export default function NewPilotPage() {
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Ajouter un pilote</h1>
      <PilotForm action={createPilotAction} submitLabel="Créer le pilote" />
    </div>
  );
}
