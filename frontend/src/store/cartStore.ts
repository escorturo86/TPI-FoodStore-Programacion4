import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Producto } from '../features/productos/types/Producto'

export interface ItemCarrito {
  producto_id: number
  nombre: string
  precio: number
  imagen_url: string | null
  cantidad: number
  stock: number
}

interface CartState {
  items: ItemCarrito[]
  agregar: (producto: Producto) => void
  quitar: (productoId: number) => void
  cambiarCantidad: (productoId: number, cantidad: number) => void
  vaciar: () => void
  total: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      agregar: (producto) => set((state) => {
        if (!producto.disponible || producto.stock < 1) return state
        const anterior = state.items.find((item) => item.producto_id === producto.id)
        if (anterior) {
          if (anterior.cantidad >= producto.stock) return state
          return { items: state.items.map((item) => item.producto_id === producto.id
            ? { ...item, cantidad: item.cantidad + 1, stock: producto.stock }
            : item) }
        }
        return { items: [...state.items, {
          producto_id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio_base,
          imagen_url: producto.imagen_url,
          cantidad: 1,
          stock: producto.stock,
        }] }
      }),
      quitar: (productoId) => set((state) => ({
        items: state.items.filter((item) => item.producto_id !== productoId),
      })),
      cambiarCantidad: (productoId, cantidad) => set((state) => ({
        items: state.items.map((item) => item.producto_id === productoId &&
          Number.isInteger(cantidad) && cantidad >= 1 && cantidad <= item.stock
          ? { ...item, cantidad }
          : item),
      })),
      vaciar: () => set({ items: [] }),
      total: () => get().items.reduce((suma, item) => suma + item.precio * item.cantidad, 0),
    }),
    {
      name: 'foodstore-carrito',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
