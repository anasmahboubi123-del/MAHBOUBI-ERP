import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// ════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Fabric = {
  id: string; name: string; color: string | null
  price_per_meter: number; cost_per_meter: number | null
  image_url: string | null; gallery: Json; stock_meters: number | null
  min_stock: number | null; supplier: string | null; active: boolean | null
  created_at: string | null
}

export type StitchStyle = {
  id: string; name: string; target: string
  price: number; cost_price: number | null
  image_url: string | null; description: string | null; active: boolean | null
  created_at: string | null
}

export type CushionStyle = {
  id: string; name: string; size_cm: number
  price: number; cost_price: number | null
  image_url: string | null; active: boolean | null
  created_at: string | null
}

export type Extra = {
  id: string; name: string; category: string | null
  price: number; cost_price: number | null
  image_url: string | null; stock: number | null
  min_stock: number | null; active: boolean | null
  created_at: string | null
}

export type Forma = {
  id: string; name: string; fabric_cm: number | null
  sewing_price: number | null; cost_price: number | null
  image_url: string | null; active: boolean | null
  created_at: string | null
}

export type Bounge = {
  id: string; name: string; density: string | null
  price_per_m3: number | null; cost_per_m3: number | null
  stock_m3: number | null; supplier: string | null
  image_url: string | null; active: boolean | null
  created_at: string | null
}

export type Tapis = {
  id: string; name: string; length_m: number | null; width_m: number | null
  price: number | null; cost_price: number | null
  stock: number | null; supplier: string | null
  image_url: string | null; active: boolean | null
  created_at: string | null
}

export type Bois = {
  id: string; name: string; wood_type: string | null
  price: number | null; cost_price: number | null
  stock: number | null; supplier: string | null
  image_url: string | null; active: boolean | null
  created_at: string | null
}

export type Khamiya = {
  id: string; name: string; quality: string | null
  price_per_m2: number | null; cost_per_m2: number | null
  stock_m2: number | null; supplier: string | null
  image_url: string | null; active: boolean | null
  created_at: string | null
}

export type Rembourrage = {
  id: string; name: string; type: string | null
  price_per_cushion: number | null; cost_per_cushion: number | null
  stock: number | null; active: boolean | null
  created_at: string | null
}

export type DecorCushion = {
  id: string; name: string; shape: string | null
  price: number | null; cost_price: number | null
  image_url: string | null; active: boolean | null
  created_at: string | null
}

export type Setting = {
  key: string
  value: Json
  description: string | null
}

// ════════════════════════════════════════════════════════════════
// Order Types
// ════════════════════════════════════════════════════════════════

export type Order = Database['public']['Tables']['orders']['Row']

export interface OrderItemInput {
  order_id: string
  kind: string
  label: string
  product_type: string
  product_name: string
  quantity: number
  qty: number
  unit_price: number
  total_price: number
  total: number
  thumbnail_url: string | null
  details: Json
  calculations: Json
  line_notes: string | null
}

export interface CartItem {
  id: string
  productType: string
  productName: string
  unitPrice: number
  quantity: number
  totalPrice: number
  thumbnailUrl?: string
  details?: Record<string, unknown>
  calculations?: Record<string, unknown>
  notes?: string
}

export interface CartState {
  items: CartItem[]
  customerName: string
  customerPhone?: string
  customerCity?: string
  deliveryDate?: string
  total: number
  deposit?: number
  discount?: number
  deliveryCost?: number
  notes?: string
  sellerId?: string
}

export interface KhamiyaOrderInput {
  customer_name?: string
  customer_phone?: string
  total: number
  deposit?: number
  delivery_date?: string
  notes?: string
  payload?: Json
  created_by?: string
}

export interface GeneratedDocumentInput {
  order_id: string
  type: 'devis' | 'bon_de_commande' | 'facture'
  number: string
  pdf_url: string
  storage_path: string
  generated_by: string
  generated_at: string
  version: number
}

// ════════════════════════════════════════════════════════════════
// Generic CRUD — as any مطلوب هنا لأن اسم الجدول متغير
// ════════════════════════════════════════════════════════════════

export async function fetchTable<T>(table: string): Promise<T[]> {
  const { data, error } = await (supabase as any)
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []) as T[]
}

export async function insertRow<T>(table: string, row: Partial<T>): Promise<T> {
  const { data, error } = await (supabase as any)
    .from(table)
    .insert([row])
    .select()
    .single()
  if (error) throw error
  return data as T
}

export async function updateRow<T>(table: string, id: string, updates: Partial<T>): Promise<T> {
  const { data, error } = await (supabase as any)
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as T
}

export async function deleteRow(table: string, id: string): Promise<void> {
  const { error } = await (supabase as any).from(table).delete().eq('id', id)
  if (error) throw error
}

// ─── Specific fetchers ───
export const fetchFabrics = () => fetchTable<Fabric>('fabrics')
export const fetchStitchStyles = () => fetchTable<StitchStyle>('stitch_styles')
export const fetchCushionStyles = () => fetchTable<CushionStyle>('cushion_styles')
export const fetchExtras = () => fetchTable<Extra>('extras')
export const fetchFormas = () => fetchTable<Forma>('formas')
export const fetchBounge = () => fetchTable<Bounge>('bounge')
export const fetchTapis = () => fetchTable<Tapis>('tapis')
export const fetchBois = () => fetchTable<Bois>('bois')
export const fetchKhamiya = () => fetchTable<Khamiya>('khamiya')
export const fetchRembourrage = () => fetchTable<Rembourrage>('rembourrage')
export const fetchDecorCushions = () => fetchTable<DecorCushion>('decor_cushions')

// ════════════════════════════════════════════════════════════════
// Settings
// ════════════════════════════════════════════════════════════════

export async function getSetting(key: string, fallback: string): Promise<string> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error || !data) return fallback

  const raw = (data as any).value
  if (raw === null || raw === undefined) return fallback

  if (typeof raw === 'object') return JSON.stringify(raw)
  return String(raw).replace(/^"|"$/g, '').trim()
}

// ════════════════════════════════════════════════════════════════
// Storage Upload
// ════════════════════════════════════════════════════════════════

export async function uploadImage(
  bucket: string,
  file: File,
  fileName?: string
): Promise<string | null> {
  const name = fileName || `${Date.now()}_${file.name}`
  const { data, error } = await supabase.storage.from(bucket).upload(name, file, { upsert: true })
  if (error) {
    console.error('Upload error:', error)
    return null
  }
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data?.path ?? name)
  return urlData?.publicUrl ?? null
}

export async function deleteImage(bucket: string, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path])
}

export interface UploadOptions {
  contentType?: string
  upsert?: boolean
}

export async function uploadToBucket(
  bucket: string,
  path: string,
  file: File | Blob | ArrayBuffer | Uint8Array,
  options?: UploadOptions
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: options?.upsert ?? true,
      contentType: options?.contentType,
    })

  if (error) {
    console.error('uploadToBucket error:', error)
    return null
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return urlData?.publicUrl ?? null
}

// ════════════════════════════════════════════════════════════════
// Orders
// ════════════════════════════════════════════════════════════════

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []) as Order[]
}

export async function createOrder(order: Partial<Order>): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert(order as any)
    .select()
    .single()
  if (error) throw error
  return data as Order
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  table: string = 'orders'
): Promise<void> {
  const { error } = await (supabase as any).from(table).update({ status }).eq('id', orderId)
  if (error) throw error
}

export async function saveKhamiyaOrder(orderData: KhamiyaOrderInput): Promise<Order> {
  const order: Partial<Order> = {
    ...orderData,
    status: 'pending',
  }

  const { data, error } = await supabase
    .from('orders')
    .insert(order as any)
    .select()
    .single()

  if (error) throw error
  return data as Order
}

// ════════════════════════════════════════════════════════════════
// finalizeOrder
// ════════════════════════════════════════════════════════════════

export async function finalizeOrder(cart: CartState): Promise<Order> {
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`

  const orderPayload: Record<string, unknown> = {
    order_number: orderNumber,
    customer_name: cart.customerName,
    customer_phone: cart.customerPhone || null,
    customer_city: cart.customerCity || null,
    total_amount: cart.total,
    deposit_amount: cart.deposit || 0,
    remaining_amount: cart.total - (cart.deposit || 0),
    status: 'new',
    delivery_date: cart.deliveryDate || null,
    notes: cart.notes || null,
    seller_id: cart.sellerId || null,
    order_type: cart.items.length > 1 ? 'mixed' : cart.items[0]?.productType || 'regular',
    source_table: 'orders',
    pdf_url: null,
  }

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert(orderPayload as any)
    .select()
    .single()

  if (orderError || !orderData) throw orderError || new Error('Failed to create order')

  const orderId = (orderData as any).id

  const orderItems: OrderItemInput[] = cart.items.map((item) => ({
    order_id: orderId,
    kind: 'product',
    label: item.productName,
    product_type: item.productType,
    product_name: item.productName,
    quantity: item.quantity,
    qty: item.quantity,
    unit_price: item.unitPrice,
    total_price: item.totalPrice,
    total: item.totalPrice,
    thumbnail_url: item.thumbnailUrl || null,
    details: (item.details || null) as Json,
    calculations: (item.calculations || null) as Json,
    line_notes: item.notes || null,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems as any)

  if (itemsError) {
    console.error('Failed to create order_items:', itemsError)
  }

  return orderData as Order
}

// ════════════════════════════════════════════════════════════════
// uploadInvoicePDF
// ════════════════════════════════════════════════════════════════

export async function uploadInvoicePDF(
  orderId: string,
  pdfBlob: Blob,
  docType: 'devis' | 'bon_de_commande' | 'facture' = 'facture',
  generatedBy?: string
): Promise<{ pdfUrl: string; docId: string } | null> {
  const timestamp = Date.now()
  const path = `invoices/${orderId}/${docType}_${timestamp}.pdf`

  const pdfUrl = await uploadToBucket('documents', path, pdfBlob, {
    contentType: 'application/pdf',
    upsert: true,
  })

  if (!pdfUrl) return null

  const docInput: GeneratedDocumentInput = {
    order_id: orderId,
    type: docType,
    number: `${docType.toUpperCase()}-${orderId.slice(0, 8)}`,
    pdf_url: pdfUrl,
    storage_path: path,
    generated_by: generatedBy || 'system',
    generated_at: new Date().toISOString(),
    version: 1,
  }

  const { data: docData, error: docError } = await supabase
    .from('generated_documents')
    .insert(docInput as any)
    .select()
    .single()

  if (docError) {
    console.error('Failed to register document:', docError)
  }

  await supabase.from('orders').update({ pdf_url: pdfUrl } as never).eq('id', orderId)

  return { pdfUrl, docId: (docData as any)?.id || '' }
}

// ════════════════════════════════════════════════════════════════
// Realtime Messages
// ════════════════════════════════════════════════════════════════

export interface MessagePayload {
  [key: string]: unknown
}

export function subscribeToOrderMessages(
  orderId: string,
  callback: (msg: MessagePayload) => void
) {
  return supabase
    .channel(`order_${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `order_id=eq.${orderId}`,
      },
      callback
    )
    .subscribe()
}

// ════════════════════════════════════════════════════════════════
// Aqiq & Khamiya Additions
// ════════════════════════════════════════════════════════════════

export type AqiqShape = {
  id: string
  name: string
  price_per_meter: number | null
  image_url: string | null
  active: boolean | null
  created_at: string | null
}

export type KhamiyaAddition = {
  id: string
  name: string
  price: number | null
  category: string | null
  image_url: string | null
  active: boolean | null
  created_at: string | null
}

export const fetchAqiqShapes = () => fetchTable<AqiqShape>('aqiq_shapes')
export const fetchKhamiyaAdditions = () => fetchTable<KhamiyaAddition>('khamiya_additions')

// ════════════════════════════════════════════════════════════════
// Order Helpers
// ════════════════════════════════════════════════════════════════

export function getOrderTotal(order: Order | null | undefined): number {
  if (!order) return 0
  const amt = order.total_amount ?? (order as any).total ?? 0
  return typeof amt === 'number' ? amt : 0
}

export function getOrderDeposit(order: Order | null | undefined): number {
  if (!order) return 0
  const amt = order.deposit_amount ?? (order as any).deposit ?? 0
  return typeof amt === 'number' ? amt : 0
}

export function getOrderRemaining(order: Order | null | undefined): number {
  if (!order) return 0
  const rem = (order as any).remaining_amount
  if (rem != null && typeof rem === 'number' && rem > 0) return rem
  return getOrderTotal(order) - getOrderDeposit(order)
}