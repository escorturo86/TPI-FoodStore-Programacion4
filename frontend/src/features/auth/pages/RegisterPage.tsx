import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { axiosInstance } from '../../../shared/api/axiosInstance'
import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'

interface Registro {
  username: string
  full_name: string
  email: string
  password: string
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const registrar = useMutation({
    mutationFn: async (datos: Registro) => {
      await axiosInstance.post('/auth/register', datos)
    },
  })

  const form = useForm({
    defaultValues: { username: '', full_name: '', email: '', password: '' },
    onSubmit: async ({ value }) => {
      setError('')
      try {
        await registrar.mutateAsync({ ...value, username: value.username.trim(), full_name: value.full_name.trim(), email: value.email.trim() })
        navigate('/login', { replace: true })
      } catch (fallo) {
        setError(handleApiError(fallo))
      }
    },
  })

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Crear cuenta</h1>
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <form.Field name="username" validators={{ onChange: ({ value }) => value.trim().length >= 3 ? undefined : 'Usá al menos 3 caracteres' }}>
          {(field) => <Input id="register-username" etiqueta="Usuario" required minLength={3} autoComplete="username" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} error={field.state.meta.isTouched ? field.state.meta.errors.map(String).join(', ') : ''} />}
        </form.Field>
        <form.Field name="full_name" validators={{ onChange: ({ value }) => value.trim().length >= 2 ? undefined : 'Ingresá tu nombre' }}>
          {(field) => <Input id="register-name" etiqueta="Nombre completo" required minLength={2} autoComplete="name" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} error={field.state.meta.isTouched ? field.state.meta.errors.map(String).join(', ') : ''} />}
        </form.Field>
        <form.Field name="email" validators={{ onChange: ({ value }) => value.includes('@') ? undefined : 'Ingresá un correo válido' }}>
          {(field) => <Input id="register-email" etiqueta="Correo electrónico" type="email" required autoComplete="email" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} error={field.state.meta.isTouched ? field.state.meta.errors.map(String).join(', ') : ''} />}
        </form.Field>
        <form.Field name="password" validators={{ onChange: ({ value }) => value.length >= 8 ? undefined : 'Usá al menos 8 caracteres' }}>
          {(field) => <Input id="register-password" etiqueta="Contraseña" type="password" required minLength={8} autoComplete="new-password" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} error={field.state.meta.isTouched ? field.state.meta.errors.map(String).join(', ') : ''} />}
        </form.Field>
        {error && <EstadoError mensaje={error} />}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>{isSubmitting ? 'Registrando...' : 'Registrarme'}</Button>}
        </form.Subscribe>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">
        ¿Ya tenés cuenta? <Link to="/login" className="text-emerald-700 underline">Ingresá</Link>
      </p>
    </Card>
  )
}
