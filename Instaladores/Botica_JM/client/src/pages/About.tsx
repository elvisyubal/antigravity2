import { Info, User, Phone, ShieldCheck, Mail, MessageCircle } from 'lucide-react';

const About: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white text-center">
                    <h1 className="text-3xl font-bold mb-2">Botica J&M POS</h1>
                    <p className="opacity-90">Sistema Integral de Gestión Farmacéutica v1.0</p>
                </div>

                <div className="p-8 space-y-8">
                    <section>
                        <div className="flex items-center gap-3 mb-4 text-orange-600">
                            <Info size={24} />
                            <h2 className="text-xl font-bold">Sobre el Software</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            Este sistema ha sido desarrollado específicamente para optimizar las operaciones diarias de <strong>Botica J&M</strong>.
                            Incluye módulos avanzados de inventario con control de lotes, gestión de ventas offline-first con sincronización automática,
                            reportes detallados y un sistema robusto de créditos para clientes.
                        </p>
                    </section>

                    <div className="grid md:grid-cols-2 gap-8">
                        <section className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                            <div className="flex items-center gap-3 mb-4 text-orange-700">
                                <User size={24} />
                                <h2 className="text-xl font-bold">Desarrollador</h2>
                            </div>
                            <div className="space-y-3">
                                <p className="font-bold text-gray-800 text-lg">Ing. Elvis Yubal Silva Velasquez</p>
                                <p className="text-gray-600">Especialista en Desarrollo de Sistemas y Automatización.</p>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Phone size={18} className="text-orange-500" />
                                    <span>+51 937 578 894</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Mail size={18} className="text-orange-500" />
                                    <span>sivel8882@gmail.com</span>
                                </div>
                            </div>
                        </section>

                        <section className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3 mb-4 text-blue-700">
                                <MessageCircle size={24} />
                                <h2 className="text-xl font-bold">Soporte Técnico</h2>
                            </div>
                            <p className="text-gray-600 mb-4">¿Necesitas ayuda o nuevas funcionalidades? Contáctame directamente por WhatsApp para asistencia inmediata.</p>
                            <a
                                href="https://wa.me/51937578894"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-all shadow-md"
                            >
                                <MessageCircle size={20} />
                                Contactar por WhatsApp
                            </a>
                        </section>
                    </div>

                    <section className="border-t border-gray-100 pt-8">
                        <div className="flex items-center gap-3 mb-6 text-gray-700">
                            <ShieldCheck size={24} />
                            <h2 className="text-xl font-bold">Seguridad y Garantía</h2>
                        </div>
                        <ul className="grid md:grid-cols-2 gap-4">
                            {[
                                'Copias de seguridad automáticas.',
                                'Cifrado de contraseñas de nivel bancario.',
                                'Acceso restringido por roles de usuario.',
                                'Auditoría completa de movimientos de inventario.',
                                'Actualizaciones de seguridad periódicas.',
                                'Optimizado para bajo consumo de recursos.'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-2 text-gray-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                    <p className="text-sm text-gray-400">© {new Date().getFullYear()} Botica J&M - Todos los derechos reservados.</p>
                </div>
            </div>
        </div>
    );
};

export default About;
