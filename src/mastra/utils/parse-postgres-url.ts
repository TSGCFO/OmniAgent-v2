/**
 * Parses a PostgreSQL connection URL into individual components
 */
export function parsePostgresUrl(connectionString: string) {
  try {
    const url = new URL(connectionString);
    
    return {
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      database: url.pathname.slice(1) || 'postgres', // Remove leading '/', default to 'postgres'
      user: url.username || 'postgres', // Default to 'postgres' if not specified
      password: url.password ? decodeURIComponent(url.password) : '',
      // Add SSL for Supabase and other cloud providers
      ssl: url.hostname.includes('supabase') || url.hostname.includes('amazonaws') 
        ? { rejectUnauthorized: false } 
        : undefined,
    };
  } catch (error) {
    throw new Error(`Invalid PostgreSQL connection string: ${error}`);
  }
}
