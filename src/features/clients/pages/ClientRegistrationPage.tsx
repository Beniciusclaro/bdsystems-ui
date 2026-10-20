import { useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { RegistrationDialog } from '../../../shared/components/ui/RegistrationDialog';
import type { Client, ClientRequest } from '../../planning/types/planning';
import { ClientForm } from '../components/ClientForm';
import { createClient, updateClient } from '../services/clientService';
import './ClientRegistrationPage.scss';

interface ClientListOutletContext {
  refreshClients: () => void;
  clients: Client[];
}

export function ClientRegistrationPage() {
  const navigate = useNavigate();

  const { clientId } = useParams();

  const { refreshClients, clients } = useOutletContext<ClientListOutletContext>();

  const client = clientId ? clients.find((item) => item.id === clientId) : undefined;

  const isEditing = Boolean(clientId);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeModal = () => navigate('/clients', { replace: true });

  const handleSubmit = async (payload: ClientRequest) => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (clientId) {
        await updateClient(clientId, payload);
        setSuccess('Cliente atualizado com sucesso.');
      } else {
        await createClient(payload);
        setSuccess('Cliente cadastrado com sucesso.');
      }

      refreshClients();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : isEditing
            ? 'Não foi possível atualizar o cliente.'
            : 'Não foi possível cadastrar o cliente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RegistrationDialog
      open
      kind="client"
      eyebrow="Cadastros"
      title={isEditing ? 'Editar cliente' : 'Cadastrar cliente'}
      isSubmitting={isSubmitting}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    >
      <section className="panel-card client-form-card">
        <p className="client-form-intro">
          {isEditing
            ? 'Atualize os dados de identificação, contato e morada do cliente.'
            : 'Informe os dados de identificação, contato e morada do cliente.'}
        </p>

        {isEditing && !client ? (
          <div className="message error" role="alert">
            O cliente não está disponível na lista carregada. Feche o cadastro e tente novamente.
          </div>
        ) : null}

        {error ? (
          <div className="message error" role="alert">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="message success" role="status">
            {success}
          </div>
        ) : null}

        {!isEditing || client ? (
          <ClientForm
            key={clientId ?? 'new'}
            initialValues={client}
            isSubmitting={isSubmitting}
            submitLabel={isEditing ? 'Atualizar cliente' : 'Cadastrar cliente'}
            submittingLabel={isEditing ? 'Atualizando...' : 'Cadastrando...'}
            onSubmit={handleSubmit}
          />
        ) : null}
      </section>
    </RegistrationDialog>
  );
}
