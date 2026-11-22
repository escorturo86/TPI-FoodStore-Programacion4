import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { useAuthStore } from '../../../store/authStore'

export function LoginPage() {
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')

  const form = useForm({
    defaultValues: { username: '', password: '' },
    onSubmit: async ({ value }) => {
      setError('')
      try {
        await login(value.username.trim(), value.password)
        const rol = useAuthStore.getState().usuario?.role
        const desde = (location.state as { desde?: string } | null)?.desde
        navigate(desde ?? (rol === 'admin' ? '/admin/resumen' : '/'), { replace: true })
      } catch (fallo) {
        setError(handleApiError(fallo))
      }
    },
  })

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Iniciar sesión</h1>
      <p className="mt-2 text-sm text-slate-600">Ingresá con tu usuario y contraseña.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <form.Field
          name="username"
          validators={{ onChange: ({ value }) => value.trim() ? undefined : 'Ingresá tu usuario' }}
        >
          {(field) => (
            <Input
              id="login-username"
              etiqueta="Usuario"
              autoComplete="username"
              required
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              error={field.state.meta.isTouched ? field.state.meta.errors.map(String).join(', ') : ''}
            />
          )}
        </form.Field>
        <form.Field
          name="password"
          validators={{ onChange: ({ value }) => value ? undefined : 'Ingresá tu contraseña' }}
        >
          {(field) => (
            <Input
              id="login-password"
              etiqueta="Contraseña"
              type="password"
              autoComplete="current-password"
              required
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              error={field.state.meta.isTouched ? field.state.meta.errors.map(String).join(', ') : ''}
            />
          )}
        </form.Field>
        {error && <EstadoError mensaje={error} />}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>
          )}
        </form.Subscribe>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">
        ¿No tenés cuenta? <Link to="/register" className="text-emerald-700 underline">Registrate</Link>
      </p>
    </Card>
  )
}
