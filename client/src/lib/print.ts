export const formatCurrency = (v: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);
export const formatDate = (d: string) => new Date(d).toLocaleString('es-PE');

export const printTicket = (sale: any, config?: any) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const companyName = config?.nombre_botica || 'BOTICA J&M';
    const companySlogan = config?.lema || '¡Tu salud es nuestra prioridad!';
    const companyRuc = config?.ruc || '';
    const companyAddress = config?.direccion || '';
    const ticketFooter = config?.pie_pagina_ticket || 'Gracias por su preferencia.';

    const html = `
        <html>
            <head>
                <title>Ticket - ${sale.codigo_venta}</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0 auto; padding: 10px; font-size: 12px; }
                    .text-center { text-align: center; }
                    .header { margin-bottom: 20px; }
                    .divider { border-top: 1px dashed #000; margin: 10px 0; }
                    .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .total { font-weight: bold; font-size: 14px; margin-top: 10px; }
                    .footer { margin-top: 20px; font-size: 10px; }
                    @media print { body { width: 80mm; margin: 0; } }
                </style>
            </head>
            <body>
                <div class="text-center header">
                    <h2 style="margin: 0;">${companyName}</h2>
                    <p style="margin: 5px 0;">${companySlogan}</p>
                    ${companyRuc ? `<p style="margin: 0;">RUC: ${companyRuc}</p>` : ''}
                    ${companyAddress ? `<p style="margin: 0;">Dir: ${companyAddress}</p>` : ''}
                </div>
                <div class="divider"></div>
                <p><strong>Venta:</strong> ${sale.codigo_venta || 'SIN CODIGO'}</p>
                <p><strong>Fecha:</strong> ${formatDate(sale.fecha || new Date().toISOString())}</p>
                <p><strong>Cajero:</strong> ${sale.usuario?.nombre || 'SISTEMA'}</p>
                <p><strong>Cliente:</strong> ${sale.cliente ? `${sale.cliente.nombres} ${sale.cliente.apellidos || ''}` : 'CONTADO'}</p>
                <div class="divider"></div>
                <div style="font-weight: bold; margin-bottom: 5px;">
                    <span style="display: inline-block; width: 40mm;">Prod.</span>
                    <span style="display: inline-block; width: 10mm;">Cant.</span>
                    <span style="display: inline-block; width: 20mm; text-align: right;">Total</span>
                </div>
                ${(sale.detalles || []).map((d: any) => `
                    <div class="item">
                        <span style="display: inline-block; width: 40mm; overflow: hidden; white-space: nowrap;">${d.producto?.nombre || 'Producto'}</span>
                        <span style="display: inline-block; width: 10mm;">${d.cantidad}</span>
                        <span style="display: inline-block; width: 20mm; text-align: right;">${formatCurrency(d.subtotal)}</span>
                    </div>
                `).join('')}
                <div class="divider"></div>
                <div class="item total">
                    <span>TOTAL</span>
                    <span>${formatCurrency(sale.total)}</span>
                </div>
                <p><strong>Método Pago:</strong> ${sale.metodo_pago}</p>
                <div class="divider"></div>
                <div class="text-center footer">
                    <p>${ticketFooter}</p>
                    <p>Visítenos pronto.</p>
                </div>
                <script>
                    window.onload = () => { 
                        window.print(); 
                        setTimeout(() => window.close(), 500);
                    };
                </script>
            </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
};
