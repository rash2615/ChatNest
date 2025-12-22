// Utilise fetch natif (Node.js 18+)
const API_URL = 'http://localhost:3000';

async function createTestUsers() {
  const users = [
    { email: 'user1@test.com', username: 'user1', password: 'password123' },
    { email: 'user2@test.com', username: 'user2', password: 'password123' },
  ];

  console.log('Création des utilisateurs de test...\n');

  for (const user of users) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`✅ ${user.username} créé avec succès`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Token: ${data.access_token.substring(0, 20)}...\n`);
      } else {
        if (data.message && data.message.includes('existe déjà')) {
          console.log(`ℹ️  ${user.username} existe déjà\n`);
        } else {
          console.log(`❌ Erreur pour ${user.username}: ${data.message}\n`);
        }
      }
    } catch (error) {
      console.log(`❌ Erreur pour ${user.username}: ${error.message}\n`);
    }
  }

  console.log('Terminé! Vous pouvez maintenant tester avec ces comptes.');
}

createTestUsers();

