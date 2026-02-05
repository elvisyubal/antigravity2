export const formatCurrency = (v: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);
export const formatDate = (d: string) => new Date(d).toLocaleString('es-PE');

export const printTicket = (sale: any, config?: any) => {
    const printWindow = window.open('', '_blank', 'width=220,height=auto');
    if (!printWindow) return;

    const companyName = config?.nombre_botica || 'BOTICA J&M';
    const companySlogan = config?.lema || '¡Tu salud es nuestra prioridad!';
    const companyRuc = config?.ruc || '';
    const companyAddress = config?.direccion || '';
    const ticketFooter = config?.pie_pagina_ticket || 'Gracias por su preferencia.';

    const html = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ticket - ${sale.codigo_venta}</title>
                <style>
                    * { 
                        margin: 0; 
                        padding: 0; 
                        box-sizing: border-box; 
                    }
                    html, body { 
                        width: 58mm;
                        height: auto;
                        margin: 0;
                        padding: 0;
                    }
                    body { 
                        font-family: 'Consolas', 'Courier New', monospace; 
                        font-size: 16px;
                        line-height: 1.3;
                        padding: 0;
                        color: #000;
                        background: #fff;
                        font-weight: bold;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .text-center { text-align: center; }
                    .header { margin-bottom: 4px; }
                    .header h2 { 
                        font-size: 20px; 
                        margin-bottom: 2px; 
                        font-weight: bold;
                        letter-spacing: 0.5px;
                    }
                    .header p { 
                        font-size: 13px; 
                        margin: 1px 0;
                        line-height: 1.1;
                        font-weight: bold;
                    }
                    .divider { 
                        border-top: 1px dashed #000; 
                        margin: 3px 0; 
                        height: 0;
                    }
                    .info-row { 
                        display: block;
                        margin: 1px 0;
                        font-size: 14px;
                        line-height: 1.3;
                        font-weight: bold;
                        white-space: nowrap;
                        overflow: hidden;
                    }
                    .info-row strong { 
                        font-weight: bold;
                    }
                    .info-row span {
                        font-weight: bold;
                    }
                    .table-header { 
                        display: grid;
                        grid-template-columns: 1fr 20px 50px;
                        gap: 2px;
                        font-weight: bold; 
                        margin: 3px 0 2px 0;
                        font-size: 13px;
                        border-bottom: 1px solid #000;
                        padding-bottom: 1px;
                    }
                    .table-header .right { text-align: right; }
                    .item { 
                        display: grid;
                        grid-template-columns: 1fr 20px 50px;
                        gap: 2px;
                        margin: 2px 0;
                        font-size: 13px;
                        page-break-inside: avoid;
                        font-weight: bold;
                    }
                    .item .prod-name {
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        font-weight: bold;
                    }
                    .item .prod-cant {
                        text-align: center;
                        font-weight: bold;
                    }
                    .item .prod-total {
                        text-align: right;
                        font-weight: bold;
                    }
                    .total-section { 
                        margin-top: 4px;
                        padding-top: 3px;
                        border-top: 2px solid #000;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        font-weight: bold;
                        font-size: 18px;
                        margin: 2px 0;
                    }
                    .payment-info {
                        margin: 3px 0 2px 0;
                        font-size: 14px;
                        font-weight: bold;
                    }
                    .footer { 
                        margin-top: 4px;
                        padding-top: 3px;
                        font-size: 13px;
                        text-align: center;
                        border-top: 1px dashed #000;
                        font-weight: bold;
                    }
                    .footer p { 
                        margin: 1px 0;
                        line-height: 1.1;
                        font-weight: bold;
                    }
                    @page {
                        size: 58mm auto;
                        margin: 0;
                    }
                    @media print { 
                        html, body { 
                            width: 58mm !important;
                            height: auto !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        body {
                            padding: 0 !important;
                            font-weight: bold !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body>
                <div class="text-center header">
                    <h2>${companyName}</h2>
                    <p>${companySlogan}</p>
                    ${companyRuc ? `<p>RUC: ${companyRuc}</p>` : ''}
                    ${companyAddress ? `<p>${companyAddress}</p>` : ''}
                </div>
                
                <div class="divider"></div>
                
                <div class="info-row">
                    <strong>Venta:</strong>
                    <span>${sale.codigo_venta || 'SIN CODIGO'}</span>
                </div>
                <div class="info-row">
                    <strong>Fecha:</strong>
                    <span>${formatDate(sale.fecha || new Date().toISOString())}</span>
                </div>
                <div class="info-row">
                    <strong>Cajero:</strong>
                    <span>${(sale.usuario?.nombre || 'SISTEMA').substring(0, 15)}</span>
                </div>
                <div class="info-row">
                    <strong>Cliente:</strong>
                    <span>${sale.cliente ? `${sale.cliente.nombres} ${sale.cliente.apellidos || ''}`.substring(0, 20) : 'CONTADO'}</span>
                </div>
                
                <div class="divider"></div>
                
                <div class="table-header">
                    <span>PRODUCTO</span>
                    <span>CANT</span>
                    <span class="right">TOTAL</span>
                </div>
                
                ${(sale.detalles || []).map((d: any) => `
                    <div class="item">
                        <span class="prod-name">${d.producto?.nombre || 'Producto'}</span>
                        <span class="prod-cant">${d.cantidad}</span>
                        <span class="prod-total">S/${Number(d.subtotal || 0).toFixed(2)}</span>
                    </div>
                `).join('')}
                
                <div class="total-section">
                    <div class="total-row">
                        <span>TOTAL:</span>
                        <span>${formatCurrency(sale.total)}</span>
                    </div>
                </div>
                
                <div class="payment-info">
                    <strong>Pago:</strong> ${sale.metodo_pago || 'CONTADO'}
                </div>
                
                <div class="footer">
                    <p>${ticketFooter}</p>
                    <p>¡Vuelva pronto!</p>
                </div>
                
                <script>
                    window.onload = () => { 
                        setTimeout(() => {
                            window.print();
                            setTimeout(() => window.close(), 800);
                        }, 100);
                    };
                </script>
            </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
};
