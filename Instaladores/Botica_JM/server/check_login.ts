
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function check() {
    console.log('Checking admin user...');
    const user = await prisma.usuario.findUnique({
        where: { username: 'admin' },
    });

    if (!user) {
        console.log('User admin NOT FOUND');
        return;
    }

    console.log('User found:', user.username);
    console.log('Role:', user.rol);
    console.log('Active:', user.activo);

    const password = 'admin123';
    const isValid = await bcrypt.compare(password, user.password);

    console.log(`Password '${password}' is valid:`, isValid);
}

check()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
