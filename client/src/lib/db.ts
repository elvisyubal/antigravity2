import Dexie, { type EntityTable } from 'dexie';

export interface OfflineProduct {
    id?: number;
    serverId?: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    categoria_id: number;
    categoria_nombre?: string;
    precio_compra: number;
    precio_venta: number;
    stock_actual: number;
    stock_minimo: number;
    es_fraccionable: boolean;
    unidades_por_caja: number;
    precio_unidad?: number;
    synced: boolean;
}

export interface OfflineSale {
    id?: number;
    serverId?: number;
    codigo_venta: string;
    items: Array<{
        producto_id: number;
        cantidad: number;
        precio_unitario: number;
        es_unidad: boolean;
    }>;
    subtotal: number;
    descuento: number;
    total: number;
    metodo_pago: string;
    cliente_id?: number;
    fecha: Date;
    usuario?: { nombre: string };
    offline?: boolean;
    synced: boolean;
}

export interface OfflineClient {
    id?: number;
    serverId?: number;
    dni_ruc?: string;
    nombres: string;
    apellidos?: string;
    telefono?: string;
    tipo: string;
    saldo_pendiente: number;
    synced: boolean;
}

export class BoticaDB extends Dexie {
    products!: EntityTable<OfflineProduct, 'id'>;
    sales!: EntityTable<OfflineSale, 'id'>;
    clients!: EntityTable<OfflineClient, 'id'>;
    syncQueue!: EntityTable<{ id?: number; type: string; action: string; data: any; timestamp: Date }, 'id'>;

    constructor() {
        super('BoticaJM');
        this.version(1).stores({
            products: '++id, serverId, codigo, nombre, categoria_id, synced',
            sales: '++id, serverId, codigo_venta, metodo_pago, synced, fecha',
            clients: '++id, serverId, dni_ruc, nombres, synced',
            syncQueue: '++id, type, action, timestamp',
        });
    }
}

export const db = new BoticaDB();

// Funciones de sincronización
export const syncProducts = async (products: any[]) => {
    await db.products.clear();
    const offlineProducts: OfflineProduct[] = products.map((p) => ({
        serverId: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        descripcion: p.descripcion,
        categoria_id: p.categoria_id,
        categoria_nombre: p.categoria?.nombre,
        precio_compra: parseFloat(p.precio_compra),
        precio_venta: parseFloat(p.precio_venta),
        stock_actual: p.stock_actual,
        stock_minimo: p.stock_minimo,
        es_fraccionable: p.es_fraccionable,
        unidades_por_caja: p.unidades_por_caja,
        precio_unidad: p.precio_unidad ? parseFloat(p.precio_unidad) : undefined,
        synced: true,
    }));
    await db.products.bulkAdd(offlineProducts);
};

export const syncClients = async (clients: any[]) => {
    await db.clients.clear();
    const offlineClients: OfflineClient[] = clients.map((c) => ({
        serverId: c.id,
        dni_ruc: c.dni_ruc,
        nombres: c.nombres,
        apellidos: c.apellidos,
        telefono: c.telefono,
        tipo: c.tipo,
        saldo_pendiente: parseFloat(c.saldo_pendiente),
        synced: true,
    }));
    await db.clients.bulkAdd(offlineClients);
};

export const addOfflineSale = async (sale: Omit<OfflineSale, 'id' | 'synced'>) => {
    const id = await db.sales.add({ ...sale, synced: false });
    await db.syncQueue.add({
        type: 'sale',
        action: 'create',
        data: { ...sale, localId: id },
        timestamp: new Date(),
    });
    return id;
};

export const getPendingSyncs = async () => {
    return await db.syncQueue.toArray();
};

export const clearSyncQueue = async () => {
    await db.syncQueue.clear();
};
