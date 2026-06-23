import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie,
} from 'recharts'
import { computeStats, availableMonths, monthLabel, monthKey, formatDuration } from '../lib/stats'

const currentMonthKey = () => {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

// Orden: Avería, No urgente, Urgente, Crítico
const PIE_COLORS = ['#64748b', '#f59e0b', '#ef4444', '#7f1d1d']

function Split({ abierto, cerrado }) {
  const total = abierto + cerrado
  const pa = total ? (abierto / total) * 100 : 0
  const pc = total ? (cerrado / total) * 100 : 0
  return (
    <div className="split-bars">
      <div className="split-row">
        <span style={{ color: 'var(--abierto)', fontWeight: 700 }}>Abiertos: {abierto}</span>
        <div className="bar-track"><div className="bar-fill" style={{ width: pa + '%', background: 'var(--abierto)' }} /></div>
      </div>
      <div className="split-row">
        <span style={{ color: 'var(--cerrado)', fontWeight: 700 }}>Cerrados: {cerrado}</span>
        <div className="bar-track"><div className="bar-fill" style={{ width: pc + '%', background: 'var(--cerrado)' }} /></div>
      </div>
    </div>
  )
}

export default function StatsTab({ tickets }) {
  const [mes, setMes] = useState(currentMonthKey())
  const meses = useMemo(() => availableMonths(tickets), [tickets])
  const s = useMemo(() => computeStats(tickets, mes), [tickets, mes])

  return (
    <div className="container">
      <div className="stats-head">
        <h2>Estadísticas</h2>
        <select className="filter-select" value={mes} onChange={(e) => setMes(e.target.value)}>
          {meses.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}{m === currentMonthKey() ? ' (mes actual)' : ''}
            </option>
          ))}
        </select>
        <span style={{ color: 'var(--muted)' }}>{s.total} tickets en el período</span>
      </div>

      {/* Tarjetas resumen */}
      <div className="cards-grid">
        <div className="stat-card">
          <div className="label">MTTR · Tiempo medio de respuesta</div>
          <div className="value">{formatDuration(s.mttrMs)}</div>
          <div className="sub">{s.mttrCount} incidente(s) cerrado(s) considerado(s)</div>
        </div>
        <div className="stat-card">
          <div className="label">Incidentes (abiertos / cerrados)</div>
          <div className="value">{s.incidentesEstado.abierto} / {s.incidentesEstado.cerrado}</div>
          <div className="sub">Total incidentes: {s.incidentesEstado.abierto + s.incidentesEstado.cerrado}</div>
        </div>
        <div className="stat-card">
          <div className="label">Otros eventos (abiertos / cerrados)</div>
          <div className="value">{s.noIncidentesEstado.abierto} / {s.noIncidentesEstado.cerrado}</div>
          <div className="sub">Eventos y mantenimientos</div>
        </div>
        <div className="stat-card">
          <div className="label">Total de tickets</div>
          <div className="value">{s.total}</div>
          <div className="sub">{monthLabel(mes)}</div>
        </div>
      </div>

      <div className="panels-grid">
        {/* Tickets generados por día */}
        <div className="panel full">
          <h3>Tickets generados en el mes</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={s.porDia}>
              <XAxis dataKey="dia" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" name="Tickets" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Por tipo */}
        <div className="panel">
          <h3>Tickets por tipo</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={s.porTipo} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" allowDecimals={false} fontSize={11} />
              <YAxis type="category" dataKey="label" width={120} fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" name="Cantidad" radius={[0, 3, 3, 0]}>
                {s.porTipo.map((t) => <Cell key={t.value} fill={t.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Clasificación de incidentes */}
        <div className="panel">
          <h3>Incidentes por clasificación</h3>
          {s.porClasificacion.every((c) => c.count === 0) ? (
            <div className="empty">Sin incidentes en el período.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={s.porClasificacion} dataKey="count" nameKey="label" outerRadius={90} label>
                  {s.porClasificacion.map((c, i) => <Cell key={c.label} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Estado incidentes */}
        <div className="panel">
          <h3>Incidentes: abiertos vs cerrados</h3>
          <Split abierto={s.incidentesEstado.abierto} cerrado={s.incidentesEstado.cerrado} />
        </div>

        {/* Estado otros */}
        <div className="panel">
          <h3>Otros eventos: abiertos vs cerrados</h3>
          <Split abierto={s.noIncidentesEstado.abierto} cerrado={s.noIncidentesEstado.cerrado} />
        </div>

        {/* Salas con más eventos e incidentes */}
        <div className="panel">
          <h3>Salas con más eventos e incidentes</h3>
          {s.porSala.length === 0 ? <div className="empty">Sin datos.</div> : (
            <table className="mini-table"><tbody>
              {s.porSala.slice(0, 8).map((r) => (
                <tr key={r.name}><td>{r.name}</td><td>{r.count}</td></tr>
              ))}
            </tbody></table>
          )}
        </div>

        {/* Activos con más eventos e incidentes */}
        <div className="panel">
          <h3>Activos con más eventos e incidentes</h3>
          {s.porActivo.length === 0 ? <div className="empty">Sin datos.</div> : (
            <table className="mini-table"><tbody>
              {s.porActivo.slice(0, 8).map((r) => (
                <tr key={r.name}><td>{r.name}</td><td>{r.count}</td></tr>
              ))}
            </tbody></table>
          )}
        </div>

        {/* Por área */}
        <div className="panel full">
          <h3>Tickets por área y tipo</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={s.porArea}>
              <XAxis dataKey="area" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="evento" name="Evento" stackId="a" fill="#2563eb" />
              <Bar dataKey="incidente" name="Incidente" stackId="a" fill="#dc2626" />
              <Bar dataKey="preventivo" name="M. Preventivo" stackId="a" fill="#16a34a" />
              <Bar dataKey="correctivo" name="M. Correctivo" stackId="a" fill="#eab308" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* MTBF */}
        <div className="panel full">
          <h3>MTBF · Tiempo medio entre fallos (activos con más de un incidente)</h3>
          {s.mtbf.length === 0 ? (
            <div className="empty">Ningún activo registró más de un incidente en el período.</div>
          ) : (
            <table className="mini-table">
              <thead><tr><td><b>Activo</b></td><td><b>N° incidentes</b></td><td style={{ textAlign: 'right' }}><b>Tiempo medio sin fallar</b></td></tr></thead>
              <tbody>
                {s.mtbf.map((r) => (
                  <tr key={r.activo}>
                    <td>{r.activo}</td>
                    <td>{r.incidentes}</td>
                    <td>{formatDuration(r.mtbfMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
