import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { api } from '../lib/api'
import type { Document, DocumentType } from '../types'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'

export default function Search(){
  const [q,setQ]=useState('')
  const [typeId,setTypeId]=useState<number|''>('' as any)
  const [empId,setEmpId]=useState<number|''>('' as any)
  const [types,setTypes]=useState<DocumentType[]>([])
  const [items,setItems]=useState<Document[]>([])
  const [loading,setLoading]=useState(false)

  useEffect(()=>{
    const input = document.querySelector('input[data-global-search]') as HTMLInputElement | null
    if(input){ setQ(input.value) }
  },[])

  const loadTypes = async()=>{ const t = await api.get('/document-types'); setTypes(t.data) }
  useEffect(()=>{ loadTypes() },[])

  const search=async()=>{
    setLoading(true)
    try{
      const {data} = await api.get('/search',{ params: { q, type_id: typeId || undefined, employee_id: empId || undefined } })
      setItems((data?.data ?? data) as Document[])
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Search Documents</div>
        <div className="toolbar" style={{flexWrap:'wrap'}}>
          <Input data-global-search placeholder="Title / employee name / tag" value={q} onChange={e=>setQ(e.target.value)} />
          <Select value={typeId as any} onChange={e=>setTypeId(Number(e.target.value))}>
            <option value="">All types</option>
            {types.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <Input placeholder="Employee ID (optional)" value={empId as any} onChange={e=>setEmpId(Number(e.target.value) as any)} />
          <Button onClick={search}>{loading?'Searching...':'Search'}</Button>
        </div>
      </div>

      <table>
        <thead><tr><th>Title</th><th>Type</th><th>Employee</th><th>Issued</th><th>Expires</th></tr></thead>
        <tbody>
          {items.map(d => (
            <tr key={d.id}>
              <td>{d.title}</td>
              <td>{d.type?.name ?? '—'}</td>
              <td className="muted">#{d.employee_id}</td>
              <td className="muted">{d.issued_at ? dayjs(d.issued_at).format('YYYY-MM-DD') : '—'}</td>
              <td className="muted">{d.expires_at ? dayjs(d.expires_at).format('YYYY-MM-DD') : '—'}</td>
            </tr>
          ))}
          {items.length===0 && <tr><td colSpan={5} className="muted">No results.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
