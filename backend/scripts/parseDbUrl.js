export function parseDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing in .env file');
  }

  const cleaned = databaseUrl.replace(/^mysql:\/\//, '');
  const [credentials, hostPart] = cleaned.split('@');

  if (!credentials || !hostPart) {
    throw new Error('Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database');
  }

  const colonIndex = credentials.indexOf(':');
  const user = credentials.slice(0, colonIndex);
  const password = decodeURIComponent(credentials.slice(colonIndex + 1));

  const [hostPort, databaseWithQuery] = hostPart.split('/');
  const database = databaseWithQuery?.split('?')[0];

  if (!database) {
    throw new Error('Database name is missing in DATABASE_URL');
  }

  const [host, port = '3306'] = hostPort.split(':');

  return {
    user,
    password,
    host,
    port: Number(port),
    database,
  };
}
