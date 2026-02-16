'use client'

export interface BillRestaurantInfo {
    id: string
    name: string
    logo_url?: string | null
    phone?: string | null
    address_line1?: string | null
    address_line2?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
    gst_number?: string | null
}

export interface BillOrderItem {
    id: string
    name: string
    quantity: number
    price: number
}

export interface BillOrderInfo {
    id: string
    order_number: string
    customer_name: string
    customer_phone?: string | null
    customer_address?: string | null
    items_total: number
    delivery_fee: number
    tax_amount: number
    total_amount: number
    payment_method: string
    payment_status: string
    status?: string
    created_at: string
    order_items?: BillOrderItem[]
    notes?: string | null
}

function formatDateTime(value: string) {
    try {
        return new Date(value).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch {
        return value
    }
}

function formatMoney(value: number | null | undefined) {
    return `Rs ${Number(value || 0).toFixed(2)}`
}

function esc(value: string | null | undefined) {
    if (!value) return ''
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}

function buildReceiptHtml(restaurant: BillRestaurantInfo, order: BillOrderInfo) {
    const address = [restaurant.address_line1, restaurant.address_line2, restaurant.city, restaurant.state, restaurant.pincode]
        .filter(Boolean)
        .join(', ')

    const itemsRows = (order.order_items || [])
        .map((item) => {
            const lineTotal = Number(item.price || 0) * Number(item.quantity || 0)
            return `
                <tr>
                    <td class="name">${esc(item.name)}</td>
                    <td class="qty">${item.quantity}</td>
                    <td class="amt">${formatMoney(lineTotal)}</td>
                </tr>
            `
        })
        .join('')

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bill - ${esc(order.order_number)}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    html, body { margin: 0; padding: 0; }
    body {
      width: 80mm;
      font-family: "Courier New", monospace;
      color: #000;
      background: #fff;
    }
    .wrap { padding: 4mm; width: 72mm; }
    .center { text-align: center; }
    .logo { width: 44px; height: 44px; object-fit: cover; border-radius: 50%; margin: 0 auto 6px; display: block; }
    .title { font-size: 15px; font-weight: 700; margin: 0 0 4px; }
    .meta { font-size: 11px; margin: 2px 0; line-height: 1.35; }
    .line { border-top: 1px dashed #000; margin: 8px 0; }
    .section-title { font-size: 11px; font-weight: 700; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { padding: 2px 0; vertical-align: top; }
    th { text-align: left; border-bottom: 1px dashed #000; }
    .name { width: 55%; }
    .qty { width: 10%; text-align: center; }
    .amt { width: 35%; text-align: right; white-space: nowrap; }
    .totals .row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
    .totals .total { font-size: 13px; font-weight: 700; margin-top: 5px; padding-top: 5px; border-top: 1px dashed #000; }
    .small { font-size: 10px; line-height: 1.35; }
    .bold { font-weight: 700; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="center">
      ${restaurant.logo_url ? `<img class="logo" src="${esc(restaurant.logo_url)}" alt="Logo" />` : ''}
      <p class="title">${esc(restaurant.name)}</p>
      ${address ? `<p class="meta">${esc(address)}</p>` : ''}
      ${restaurant.phone ? `<p class="meta">Phone: ${esc(restaurant.phone)}</p>` : ''}
      ${restaurant.gst_number ? `<p class="meta">GST: ${esc(restaurant.gst_number)}</p>` : ''}
    </div>

    <div class="line"></div>

    <div class="small">
      <div><span class="bold">Order:</span> ${esc(order.order_number)}</div>
      <div><span class="bold">Date:</span> ${esc(formatDateTime(order.created_at))}</div>
    </div>

    <div class="line"></div>

    <div>
      <div class="section-title">Customer</div>
      <div class="small"><span class="bold">Name:</span> ${esc(order.customer_name)}</div>
      ${order.customer_phone ? `<div class="small"><span class="bold">Phone:</span> ${esc(order.customer_phone)}</div>` : ''}
      ${order.customer_address ? `<div class="small"><span class="bold">Address:</span> ${esc(order.customer_address)}</div>` : ''}
    </div>

    <div class="line"></div>

    <div>
      <div class="section-title">Items</div>
      <table>
        <thead>
          <tr>
            <th class="name">Item</th>
            <th class="qty">Qty</th>
            <th class="amt">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows || '<tr><td colspan="3" class="small">No items</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="line"></div>

    <div class="totals">
      <div class="row"><span>Items</span><span>${formatMoney(order.items_total)}</span></div>
      <div class="row"><span>Delivery</span><span>${formatMoney(order.delivery_fee)}</span></div>
      <div class="row"><span>Tax</span><span>${formatMoney(order.tax_amount)}</span></div>
      <div class="row total"><span>Total</span><span>${formatMoney(order.total_amount)}</span></div>
    </div>

    <div class="line"></div>

    <div class="small">
      <div><span class="bold">Payment:</span> ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}</div>
      <div><span class="bold">Status:</span> ${esc(order.payment_status || 'pending')}</div>
      ${order.notes ? `<div><span class="bold">Note:</span> ${esc(order.notes)}</div>` : ''}
    </div>

    <div class="line"></div>
    <div class="center small">Thank you</div>
  </div>
</body>
</html>`
}

function openAndPrint(html: string, title: string) {
    if (typeof window === 'undefined') return false

    const printWindow = window.open('', '_blank', 'width=420,height=900')

    if (!printWindow) return false

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.document.title = title

    const doPrint = () => {
        printWindow.focus()
        printWindow.print()
    }

    printWindow.onload = doPrint
    // Fallback if load event misses
    window.setTimeout(doPrint, 500)
    printWindow.onafterprint = () => {
        printWindow.close()
    }

    return true
}

function buildKotHtml(restaurant: BillRestaurantInfo, order: BillOrderInfo) {
    const address = [restaurant.address_line1, restaurant.address_line2, restaurant.city, restaurant.state, restaurant.pincode]
        .filter(Boolean)
        .join(', ')

    const itemsRows = (order.order_items || [])
        .map((item) => {
            return `
                <tr>
                    <td class="qty">${item.quantity}x</td>
                    <td class="name">${esc(item.name)}</td>
                </tr>
            `
        })
        .join('')

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>KOT - ${esc(order.order_number)}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    html, body { margin: 0; padding: 0; }
    body { width: 80mm; font-family: "Courier New", monospace; color: #000; background: #fff; }
    .wrap { padding: 4mm; width: 72mm; }
    .center { text-align: center; }
    .title { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
    .kot { font-size: 18px; font-weight: 700; letter-spacing: 1px; }
    .meta { font-size: 11px; margin: 2px 0; line-height: 1.35; }
    .line { border-top: 1px dashed #000; margin: 8px 0; }
    .small { font-size: 10px; line-height: 1.35; }
    .bold { font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    td { padding: 3px 0; vertical-align: top; }
    .qty { width: 22%; font-weight: 700; }
    .name { width: 78%; }
    .foot { font-size: 10px; margin-top: 8px; text-align: center; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="center">
      <div class="kot">KOT</div>
      <p class="title">${esc(restaurant.name)}</p>
      ${address ? `<p class="meta">${esc(address)}</p>` : ''}
      ${restaurant.phone ? `<p class="meta">Phone: ${esc(restaurant.phone)}</p>` : ''}
    </div>

    <div class="line"></div>

    <div class="small">
      <div><span class="bold">Order:</span> ${esc(order.order_number)}</div>
      <div><span class="bold">Time:</span> ${esc(formatDateTime(order.created_at))}</div>
      <div><span class="bold">Customer:</span> ${esc(order.customer_name)}</div>
      ${order.customer_phone ? `<div><span class="bold">Phone:</span> ${esc(order.customer_phone)}</div>` : ''}
      <div><span class="bold">Type:</span> ${order.customer_address ? 'Delivery' : 'Pickup'}</div>
    </div>

    <div class="line"></div>

    <table>
      <tbody>
        ${itemsRows || '<tr><td class="small">No items</td></tr>'}
      </tbody>
    </table>

    ${order.notes ? `
      <div class="line"></div>
      <div class="small"><span class="bold">Note:</span> ${esc(order.notes)}</div>
    ` : ''}

    <div class="line"></div>
    <div class="foot">Kitchen copy</div>
  </div>
</body>
</html>`
}

export function printThermalBill(restaurant: BillRestaurantInfo, order: BillOrderInfo) {
    return openAndPrint(buildReceiptHtml(restaurant, order), `Bill - ${order.order_number}`)
}

export function printThermalKot(restaurant: BillRestaurantInfo, order: BillOrderInfo) {
    return openAndPrint(buildKotHtml(restaurant, order), `KOT - ${order.order_number}`)
}
