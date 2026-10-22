import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Panel } from '../../../shared/components/ui/Panel';
import { getEmployees } from '../../employees/services/employeeService';
import type { EmployeeResponse } from '../../employees/types/employee';
import { getLaborRoles, saveLaborProfile, saveLaborRole } from '../services/planningService';
import type { LaborRole } from '../types/planning';
import './Planning.scss';

export function LaborPage() {
  const [roles, setRoles] = useState<LaborRole[]>([]);

  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);

  const [error, setError] = useState('');

  const [pending, setPending] = useState(false);

  const [role, setRole] = useState({
    code: '',
    name: '',
    costingMode: 'MANUAL' as LaborRole['costingMode'],
    manualHourlyCost: '',
  });

  const [profile, setProfile] = useState({
    employeeId: '',
    laborRoleId: '',
    productiveHoursMonth: '160',
    workDaysMonth: '22',
    employerChargesPercent: '0',
    monthlyBenefits: '0',
    otherMonthlyCosts: '0',
  });

  const reload = () => getLaborRoles().then(setRoles);

  useEffect(() => {
    reload().catch((cause) =>
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar mão de obra.'),
    );
    getEmployees(0, 200, { status: 'ACTIVE' })
      .then((result) => setEmployees(result.content))
      .catch(() => undefined);
  }, []);

  const run = async (action: () => Promise<unknown>) => {
    if (pending) return;

    setPending(true);
    setError('');

    try {
      await action();
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao salvar.');
    } finally {
      setPending(false);
    }
  };

  const submitRole = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      await saveLaborRole({
        code: role.code,
        name: role.name,
        description: '',
        costingMode: role.costingMode,
        manualHourlyCost: role.costingMode === 'MANUAL' ? Number(role.manualHourlyCost) : null,
        active: true,
      });
      setRole({ ...role, code: '', name: '', manualHourlyCost: '' });
    });
  };

  const submitProfile = (event: FormEvent) => {
    event.preventDefault();
    void run(() =>
      saveLaborProfile(profile.employeeId, {
        laborRoleId: profile.laborRoleId,
        productiveHoursMonth: Number(profile.productiveHoursMonth),
        workDaysMonth: profile.workDaysMonth ? Number(profile.workDaysMonth) : null,
        employerChargesPercent: Number(profile.employerChargesPercent),
        monthlyBenefits: Number(profile.monthlyBenefits),
        otherMonthlyCosts: Number(profile.otherMonthlyCosts),
      }),
    );
  };

  return (
    <main className="dashboard-content planning-page">
      <PageHeader eyebrow="Planeamento" title="Mão de obra" />

      {error ? (
        <p className="planning-alert" role="alert">
          {error}
        </p>
      ) : null}

      <div className="planning-grid planning-grid--two">
        <Panel>
          <h2>Custo baseado no funcionário</h2>
          <form className="planning-form" onSubmit={submitProfile}>
            <label>
              Funcionário
              <select
                required
                value={profile.employeeId}
                onChange={(event) => setProfile({ ...profile, employeeId: event.target.value })}
              >
                <option value="">Selecione</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Função
              <select
                required
                value={profile.laborRoleId}
                onChange={(event) => setProfile({ ...profile, laborRoleId: event.target.value })}
              >
                <option value="">Selecione</option>
                {roles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <NumberField
              label="Horas produtivas/mês"
              value={profile.productiveHoursMonth}
              onChange={(value) => setProfile({ ...profile, productiveHoursMonth: value })}
              min="0.01"
            />
            <NumberField
              label="Dias trabalhados/mês"
              value={profile.workDaysMonth}
              onChange={(value) => setProfile({ ...profile, workDaysMonth: value })}
              min="0.01"
              required={false}
            />
            <NumberField
              label="Encargos (%)"
              value={profile.employerChargesPercent}
              onChange={(value) => setProfile({ ...profile, employerChargesPercent: value })}
            />
            <NumberField
              label="Benefícios mensais"
              value={profile.monthlyBenefits}
              onChange={(value) => setProfile({ ...profile, monthlyBenefits: value })}
            />
            <NumberField
              label="Outros custos mensais"
              value={profile.otherMonthlyCosts}
              onChange={(value) => setProfile({ ...profile, otherMonthlyCosts: value })}
            />
            <button disabled={pending}>Calcular e vincular</button>
          </form>
        </Panel>

        <Panel>
          <h2>Funções de mão de obra</h2>
          <p>Cadastre as funções usadas como componentes das composições.</p>
          <form className="planning-form" onSubmit={submitRole}>
            <label>
              Código
              <input
                required
                value={role.code}
                onChange={(event) => setRole({ ...role, code: event.target.value })}
              />
            </label>
            <label>
              Função
              <input
                required
                value={role.name}
                onChange={(event) => setRole({ ...role, name: event.target.value })}
              />
            </label>
            <label>
              Cálculo
              <select
                value={role.costingMode}
                onChange={(event) =>
                  setRole({ ...role, costingMode: event.target.value as LaborRole['costingMode'] })
                }
              >
                <option value="MANUAL">Custo/hora manual</option>
                <option value="EMPLOYEE_AVERAGE">Média dos funcionários</option>
              </select>
            </label>
            {role.costingMode === 'MANUAL' ? (
              <NumberField
                label="Custo por hora"
                value={role.manualHourlyCost}
                onChange={(value) => setRole({ ...role, manualHourlyCost: value })}
              />
            ) : null}
            <button className="primary-button" disabled={pending}>
              Cadastrar função
            </button>
          </form>
          {roles.length ? (
            <ul className="planning-records">
              {roles.map((item) => (
                <li key={item.id}>
                  {item.code} · {item.name} ·{' '}
                  {item.currentHourlyCost == null
                    ? 'sem custo'
                    : `${money(item.currentHourlyCost)}/h`}
                </li>
              ))}
            </ul>
          ) : (
            <p className="planning-empty">Nenhuma função cadastrada.</p>
          )}
        </Panel>
      </div>
    </main>
  );
}

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  required?: boolean;
}

function NumberField({ label, value, onChange, min = '0', required = true }: NumberFieldProps) {
  return (
    <label>
      {label}
      <input
        required={required}
        type="number"
        min={min}
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

const money = (value: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
