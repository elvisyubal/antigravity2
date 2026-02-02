
async function testLogin() {
    try {
        console.log('Testing login endpoint...');
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Data:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

testLogin();
