const { createClient } = require('@libsql/client');
try {
    const client = createClient({ url: 'file:./prisma/dev.db' });
    console.log('LibSQL client created');
    process.exit(0);
} catch (e) {
    console.error('LibSQL error:', e.message);
    process.exit(1);
}
