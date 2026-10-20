import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Panel } from '../../../shared/components/ui/Panel';
import {
  getClients,
  getLaborRoles,
  getProjects,
  saveLaborRole,
  saveLaborProfile,
  saveProject,
} from '../services/planningService';
import type { Client, LaborRole, Project } from '../types/planning';
import { getEmployees } from '../../employees/services/employeeService';
import type { EmployeeResponse } from '../../employees/types/employee';
import './Planning.scss';

export function PlanningCatalogPage() {
  const [clients, setClients] = useState<Client[]>([]);

  const [projects, setProjects] = useState<Project[]>([]);

  const [roles, setRoles] = useState<LaborRole[]>([]);

  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);

  const [error, setError] = useState('');

  const [pending, setPending] = useState(false);

  const [project, setProject] = useState({
    clientId: '',
    code: '',
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });

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

  const reload = () =>
    Promise.all([getClients(), getProjects(), getLaborRoles()]).then(([c, p, r]) => {
      setClients(c);
      setProjects(p);
      setRoles(r);
    });
  useEffect(() => {
    reload().catch((e) => setError(e instanceof Error ? e.message : 'Falha ao carregar.'));
    getEmployees(0, 200, { status: 'ACTIVE' })
      .then((result) => setEmployees(result.content))
      .catch(() => undefined);
  }, []);
  const run = async (action: () => Promise<unknown>) => {
    setPending(true);
    setError('');
    try {
      await action();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar.');
    } finally {
      setPending(false);
    }
  };

  const submitProject = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await saveProject({
        ...project,
        description: null,
        plannedStartDate: null,
        plannedEndDate: null,
        status: 'PLANNING',
        active: true,
        street: project.street || null,
        city: project.city || null,
        state: project.state || null,
        zipCode: project.zipCode || null,
      });
      setProject({ ...project, code: '', name: '' });
    });
  };

  const submitRole = (e: FormEvent) => {
    e.preventDefault();
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

  const submitProfile = (e: FormEvent) => {
    e.preventDefault();
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
      <PageHeader eyebrow="Planejamento" title="Obras e mão de obra" />
      {error && (
        <p className="planning-alert" role="alert">
          {error}
        </p>
      )}
      <div className="planning-grid">
        <Panel>
          <h2>Custo baseado no funcionário</h2>
          <form className="planning-form" onSubmit={submitProfile}>
            <label>
              Funcionário
              <select
                required
                value={profile.employeeId}
                onChange={(e) => setProfile({ ...profile, employeeId: e.target.value })}
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
                onChange={(e) => setProfile({ ...profile, laborRoleId: e.target.value })}
              >
                <option value="">Selecione</option>
                {roles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Horas produtivas/mês
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={profile.productiveHoursMonth}
                onChange={(e) => setProfile({ ...profile, productiveHoursMonth: e.target.value })}
              />
            </label>
            <label>
              Dias trabalhados/mês
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={profile.workDaysMonth}
                onChange={(e) => setProfile({ ...profile, workDaysMonth: e.target.value })}
              />
            </label>
            <label>
              Encargos (%)
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={profile.employerChargesPercent}
                onChange={(e) => setProfile({ ...profile, employerChargesPercent: e.target.value })}
              />
            </label>
            <label>
              Benefícios mensais
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={profile.monthlyBenefits}
                onChange={(e) => setProfile({ ...profile, monthlyBenefits: e.target.value })}
              />
            </label>
            <label>
              Outros custos mensais
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={profile.otherMonthlyCosts}
                onChange={(e) => setProfile({ ...profile, otherMonthlyCosts: e.target.value })}
              />
            </label>
            <button disabled={pending}>Calcular e vincular</button>
          </form>
        </Panel>
        <Panel>
          <h2>Obras</h2>
          <form className="planning-form" onSubmit={submitProject}>
            <label>
              Cliente
              <select
                required
                value={project.clientId}
                onChange={(e) => setProject({ ...project, clientId: e.target.value })}
              >
                <option value="">Selecione</option>
                {clients
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Código
              <input
                required
                value={project.code}
                onChange={(e) => setProject({ ...project, code: e.target.value })}
              />
            </label>
            <label>
              Nome da obra
              <input
                required
                value={project.name}
                onChange={(e) => setProject({ ...project, name: e.target.value })}
              />
            </label>
            <label>
              Morada
              <input
                value={project.street}
                onChange={(e) => setProject({ ...project, street: e.target.value })}
              />
            </label>
            <button className="primary-button" disabled={pending}>
              Cadastrar obra
            </button>
          </form>
          <RecordList rows={projects.map((p) => `${p.code} · ${p.name} · ${p.clientName}`)} />
        </Panel>
        <Panel>
          <h2>Mão de obra</h2>
          <p>
            Cadastre a função usada como componente. O custo pode ser manual ou calculado pelos
            funcionários vinculados.
          </p>
          <form className="planning-form" onSubmit={submitRole}>
            <label>
              Código
              <input
                required
                value={role.code}
                onChange={(e) => setRole({ ...role, code: e.target.value })}
              />
            </label>
            <label>
              Função
              <input
                required
                value={role.name}
                onChange={(e) => setRole({ ...role, name: e.target.value })}
              />
            </label>
            <label>
              Cálculo
              <select
                value={role.costingMode}
                onChange={(e) =>
                  setRole({ ...role, costingMode: e.target.value as LaborRole['costingMode'] })
                }
              >
                <option value="MANUAL">Custo/hora manual</option>
                <option value="EMPLOYEE_AVERAGE">Média dos funcionários</option>
              </select>
            </label>
            {role.costingMode === 'MANUAL' && (
              <label>
                Custo por hora
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={role.manualHourlyCost}
                  onChange={(e) => setRole({ ...role, manualHourlyCost: e.target.value })}
                />
              </label>
            )}
            <button className="primary-button" disabled={pending}>
              Cadastrar função
            </button>
          </form>
          <RecordList
            rows={roles.map(
              (r) =>
                `${r.code} · ${r.name} · ${r.currentHourlyCost == null ? 'sem custo' : money(r.currentHourlyCost) + '/h'}`,
            )}
          />
        </Panel>
      </div>
    </main>
  );
}
function RecordList({ rows }: { rows: string[] }) {
  return rows.length ? (
    <ul className="planning-records">
      {rows.map((row) => (
        <li key={row}>{row}</li>
      ))}
    </ul>
  ) : (
    <p className="planning-empty">Nenhum cadastro.</p>
  );
}
const money = (value: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
